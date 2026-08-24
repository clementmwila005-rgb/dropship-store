import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import {
  lipilaMode,
  lipilaCreateCardCollection,
  lipilaCreateMoMoCollection,
} from "@/lib/lipila";
import { genOrderNumber, ZAMBIAN_PROVINCES } from "@/lib/format";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Please log in to check out" }, { status: 401 });

  try {
    const body = await req.json();
    const paymentMethod = body.paymentMethod === "mobile_money" ? "mobile_money" : "card";
    const shipToHome = body.shipToHome === true;
    const whatsappNumber = String(body.whatsappNumber || "").trim();
    const shipping = {
      email: String(body.email || user.email || "").trim(),
      name: String(body.name || user.name || "").trim(),
      address1: String(body.address1 || "").trim(),
      address2: String(body.address2 || "").trim(),
      city: String(body.city || "").trim(),
      state: String(body.state || "").trim(),
      zip: String(body.zip || "").trim(),
      country: "Zambia",
      phone: String(body.phone || "").trim(),
    };
    const agent = {
      agentName: String(body.agentName || "").trim(),
      agentPhone: String(body.agentPhone || "").trim(),
      agentAddress: String(body.agentAddress || "").trim(),
      agentCity: String(body.agentCity || "").trim(),
      agentProvince: String(body.agentProvince || "").trim(),
      agentZip: String(body.agentZip || "").trim(),
    };

    if (
      !shipping.name ||
      !shipping.address1 ||
      !shipping.city ||
      !ZAMBIAN_PROVINCES.includes(shipping.state) ||
      !shipping.phone
    ) {
      return NextResponse.json({ error: "Please fill in all required shipping fields" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }
    if (!shipToHome && (!agent.agentName || !agent.agentPhone || !agent.agentAddress)) {
      return NextResponse.json({ error: "Please fill in your shipping agent details (name, phone and address in China) or tick the box to ship to your home address" }, { status: 400 });
    }
    if (shipToHome && !/^\+?\d{7,15}$/.test(whatsappNumber.replace(/[\s-]/g, ""))) {
      return NextResponse.json({ error: "Please enter your WhatsApp number so we can send you the shipping fee" }, { status: 400 });
    }

    const { data: cart } = await supabase
      .from("CartItem")
      .select("*, product:Product(*), variant:ProductVariant(*)")
      .eq("userId", user.id);

    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }

    const currency = "ZMW";
    const subtotalCents = cart.reduce(
      (sum, item) => sum + ((item.variant as any)?.priceCents ?? (item.product as any).priceCents) * item.quantity,
      0
    );
    const shippingCents = 0;
    const totalCents = subtotalCents + shippingCents;
    const orderNumber = genOrderNumber();

    const { data: order, error: orderError } = await supabase
      .from("Order")
      .insert({
        number: orderNumber,
        userId: user.id,
        email: shipping.email,
        name: shipping.name,
        address1: shipping.address1,
        address2: shipping.address2 || null,
        city: shipping.city,
        state: shipping.state || null,
        zip: shipping.zip,
        country: shipping.country,
        phone: shipping.phone || null,
        shipToHome,
        whatsappNumber: shipToHome ? whatsappNumber || null : null,
        agentName: shipToHome ? null : agent.agentName || null,
        agentPhone: shipToHome ? null : agent.agentPhone || null,
        agentAddress: shipToHome ? null : agent.agentAddress || null,
        agentCity: shipToHome ? null : agent.agentCity || null,
        agentProvince: shipToHome ? null : agent.agentProvince || null,
        agentZip: shipToHome ? null : agent.agentZip || null,
        subtotalCents,
        shippingCents,
        totalCents,
        currency,
        paymentMethod,
      })
      .select("id")
      .single();

    if (orderError) throw orderError;

    // Insert order items
    await supabase.from("OrderItem").insert(
      cart.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        name: (item.product as any).name,
        variantName: (item.variant as any)?.name || item.variantKey || null,
        priceCents: (item.variant as any)?.priceCents ?? (item.product as any).priceCents,
        quantity: item.quantity,
        imageUrl: (item.product as any).imageUrl,
      }))
    );

    // Update user's saved address
    await supabase
      .from("User")
      .update({
        name: shipping.name,
        address1: shipping.address1,
        address2: shipping.address2 || null,
        city: shipping.city,
        state: shipping.state || null,
        zip: shipping.zip,
        country: shipping.country,
        phone: shipping.phone || null,
        ...(shipToHome
          ? {}
          : {
              agentName: agent.agentName || null,
              agentPhone: agent.agentPhone || null,
              agentAddress: agent.agentAddress || null,
              agentCity: agent.agentCity || null,
              agentProvince: agent.agentProvince || null,
              agentZip: agent.agentZip || null,
            }),
      })
      .eq("id", user.id);

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const callbackUrl = process.env.LIPILA_CALLBACK_URL || `${appUrl}/api/lipila/webhook`;

    if (lipilaMode() === "offline") {
      await supabase
        .from("Order")
        .update({ status: "PAID", lipilaReference: order.id, lipilaIdentifier: "OFFLINE" })
        .eq("id", order.id);
      await supabase.from("CartItem").delete().eq("userId", user.id);
      return NextResponse.json({ ok: true, mode: "offline", orderId: order.id });
    }

    if (paymentMethod === "mobile_money") {
      const momo = await lipilaCreateMoMoCollection({
        orderId: order.id,
        amountCents: totalCents,
        accountNumber: shipping.phone || "",
        email: shipping.email,
        callbackUrl,
      });

      await supabase
        .from("Order")
        .update({ lipilaReference: order.id, lipilaIdentifier: momo.identifier || null })
        .eq("id", order.id);

      return NextResponse.json({
        ok: true,
        mode: "lipila",
        method: "mobile_money",
        orderId: order.id,
      });
    }

    const nameParts = shipping.name.split(/\s+/);
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || firstName;

    const lipila = await lipilaCreateCardCollection({
      orderId: order.id,
      amountCents: totalCents,
      customer: {
        firstName,
        lastName,
        phone: shipping.phone || "",
        email: shipping.email,
        city: shipping.city,
        address: [shipping.address1, shipping.address2].filter(Boolean).join(", "),
        zip: shipping.zip,
      },
      backUrl: `${appUrl}/checkout/return?order=${order.id}`,
      callbackUrl,
    });

    await supabase
      .from("Order")
      .update({ lipilaReference: order.id, lipilaIdentifier: lipila.identifier || null })
      .eq("id", order.id);

    if (!lipila.cardRedirectionUrl) {
      return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ ok: true, mode: "lipila", method: "card", orderId: order.id, url: lipila.cardRedirectionUrl });
  } catch (e) {
    console.error("checkout error", e);
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 500 });
  }
}

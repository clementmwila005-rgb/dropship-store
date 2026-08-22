import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data: cart } = await supabase
    .from("CartItem")
    .select("*, product:Product(*), variant:ProductVariant(*)")
    .eq("userId", user.id)
    .order("createdAt", { ascending: true });

  const items = cart || [];
  const totalCents = items.reduce(
    (sum, item) => sum + ((item.variant as any)?.priceCents ?? (item.product as any).priceCents) * item.quantity,
    0
  );

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      variantKey: item.variantKey,
      variant: item.variant
        ? {
            id: (item.variant as any).id,
            name: (item.variant as any).name,
            priceCents: (item.variant as any).priceCents,
          }
        : null,
      product: {
        id: (item.product as any).id,
        name: (item.product as any).name,
        slug: (item.product as any).slug,
        priceCents: (item.product as any).priceCents,
        compareAtCents: (item.product as any).compareAtCents,
        imageUrl: (item.product as any).imageUrl,
        stock: (item.product as any).stock,
      },
    })),
    totalCents,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
  });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json();
  const productId = String(body.productId || "");
  const quantity = Math.max(1, Math.min(99, Number(body.quantity) || 1));
  const variantId = body.variantId ? String(body.variantId) : null;
  let variantKey = body.variantKey !== undefined ? String(body.variantKey) : "";

  if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });

  const { data: product } = await supabase
    .from("Product")
    .select("id, isActive")
    .eq("id", productId)
    .single();
  if (!product || !product.isActive) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  if (variantId) {
    const { data: variant } = await supabase
      .from("ProductVariant")
      .select("id, name")
      .eq("id", variantId)
      .eq("productId", productId)
      .single();
    if (!variant) return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    if (!variantKey) variantKey = variant.name;
  }

  const { data: existing } = await supabase
    .from("CartItem")
    .select("id")
    .eq("userId", user.id)
    .eq("productId", productId)
    .eq("variantKey", variantKey)
    .maybeSingle();

  if (existing) {
    await supabase.from("CartItem").update({ quantity }).eq("id", existing.id);
  } else {
    await supabase.from("CartItem").insert({
      userId: user.id,
      productId,
      variantId,
      variantKey,
      quantity,
    });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json();
  const productId = String(body.productId || "");
  const quantity = Math.max(1, Math.min(99, Number(body.quantity) || 1));
  const variantKey = body.variantKey !== undefined ? String(body.variantKey) : null;
  const variantId = body.variantId ? String(body.variantId) : null;

  let query = supabase.from("CartItem").update({ quantity }).eq("userId", user.id).eq("productId", productId);
  if (variantKey !== null) {
    query = query.eq("variantKey", variantKey);
  } else if (variantId) {
    query = query.eq("variantId", variantId);
  }
  await query;

  return NextResponse.json({ ok: true });
}

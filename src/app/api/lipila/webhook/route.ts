import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { lipilaMode, verifyLipilaWebhook } from "@/lib/lipila";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const raw = await req.text();
  const headers = req.headers;

  const mode = lipilaMode();
  const secret = process.env.LIPILA_WEBHOOK_SECRET;

  if (mode === "live" && !secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  if (secret) {
    const check = verifyLipilaWebhook(raw, headers);
    if (!check.ok) {
      console.warn("Lipila webhook rejected:", check.reason);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else {
    console.warn("Lipila webhook signature not verified: LIPILA_WEBHOOK_SECRET is not set");
  }

  let body: {
    referenceId?: string;
    identifier?: string;
    referenceData?: string;
    status?: string;
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const refs = [body.referenceId, body.identifier, body.referenceData].filter(Boolean) as string[];
  if (refs.length === 0) {
    return NextResponse.json({ error: "Missing transaction reference" }, { status: 400 });
  }

  const { data: order } = await supabase
    .from("Order")
    .select("*")
    .or(`lipilaReference.in.(${refs.join(",")}),lipilaIdentifier.in.(${refs.join(",")})`)
    .maybeSingle();

  if (!order) {
    console.warn("Lipila webhook: no matching order for", refs);
    return NextResponse.json({ ok: true });
  }

  if (order.status === "PAID" || order.status === "PROCESSING") {
    return NextResponse.json({ ok: true });
  }

  const status = String(body.status || "").toLowerCase();

  if (status === "successful" || status === "success") {
    await supabase
      .from("Order")
      .update({
        status: "PAID",
        lipilaIdentifier: order.lipilaIdentifier || String(body.identifier || "") || null,
      })
      .eq("id", order.id);
    if (order.userId) {
      await supabase.from("CartItem").delete().eq("userId", order.userId);
    }
  } else if (status === "failed") {
    await supabase
      .from("Order")
      .update({ status: "CANCELLED" })
      .eq("id", order.id)
      .eq("status", "PENDING");
  }

  return NextResponse.json({ ok: true });
}

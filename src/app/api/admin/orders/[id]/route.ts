import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/format";

export const runtime = "nodejs";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();

  const { data: order } = await supabase
    .from("Order")
    .select("*")
    .eq("id", id)
    .single();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const data: Record<string, any> = {};

  if (body.status !== undefined) {
    const status = String(body.status).toUpperCase();
    if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number]))
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    data.status = status;
  }
  if (body.trackingNumber !== undefined) {
    data.trackingNumber = String(body.trackingNumber).trim() || null;
  }
  if (body.trackingCarrier !== undefined) {
    data.trackingCarrier = String(body.trackingCarrier).trim() || null;
  }

  const { data: updated } = await supabase
    .from("Order")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  return NextResponse.json({ ok: true, order: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const { data: order } = await supabase
    .from("Order")
    .select("status")
    .eq("id", id)
    .single();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (order.status !== "PENDING") {
    return NextResponse.json(
      { error: "Only pending (unpaid) orders can be deleted. Mark paid orders as CANCELLED instead." },
      { status: 400 }
    );
  }

  await supabase.from("Order").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}

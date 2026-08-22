import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { lipilaMode, lipilaCheckStatus } from "@/lib/lipila";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("order") || "";

  const { data: order } = await supabase
    .from("Order")
    .select("*")
    .eq("id", orderId)
    .single();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.userId !== user.id) return NextResponse.json({ error: "Not your order" }, { status: 403 });

  let status = order.status;

  if (order.lipilaReference && lipilaMode() !== "offline") {
    try {
      const info = await lipilaCheckStatus(order.lipilaReference);
      const s = String(info.status || "").toLowerCase();
      if (s.includes("success")) {
        if (order.status !== "PAID") {
          await supabase
            .from("Order")
            .update({
              status: "PAID",
              lipilaIdentifier: order.lipilaIdentifier || info.identifier || null,
            })
            .eq("id", order.id);
          if (order.userId) await supabase.from("CartItem").delete().eq("userId", order.userId);
        }
        status = "PAID";
      } else if (s.includes("fail") && order.status === "PENDING") {
        await supabase
          .from("Order")
          .update({ status: "CANCELLED" })
          .eq("id", order.id);
        status = "CANCELLED";
      }
    } catch (e) {
      console.error("lipila status check error", e);
    }
  }

  return NextResponse.json({ status });
}

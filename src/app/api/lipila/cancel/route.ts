import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { order } = await req.json().catch(() => ({}));
  if (!order) return NextResponse.json({ error: "Missing order" }, { status: 400 });

  const { count } = await supabase
    .from("Order")
    .update({ status: "CANCELLED" })
    .eq("id", String(order))
    .eq("userId", user.id)
    .eq("status", "PENDING");

  return NextResponse.json({ ok: (count ?? 0) > 0 });
}

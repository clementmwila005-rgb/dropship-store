import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: orders } = await supabase
    .from("Order")
    .select("*, items:OrderItem(*), user:User(id, name, email)")
    .order("createdAt", { ascending: false });

  return NextResponse.json({ orders: orders || [] });
}

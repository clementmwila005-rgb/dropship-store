import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function DELETE(req: Request, ctx: { params: Promise<{ productId: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { productId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const variantKey = body.variantKey !== undefined ? String(body.variantKey) : null;
  const variantId = body.variantId ? String(body.variantId) : null;

  let query = supabase.from("CartItem").delete().eq("userId", user.id).eq("productId", productId);
  if (variantKey !== null) {
    query = query.eq("variantKey", variantKey);
  } else if (variantId) {
    query = query.eq("variantId", variantId);
  }
  await query;

  return NextResponse.json({ ok: true });
}

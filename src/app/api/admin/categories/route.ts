import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: categories } = await supabase
    .from("Category")
    .select("*")
    .order("name", { ascending: true });

  return NextResponse.json({ categories: categories || [] });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Category name is required" }, { status: 400 });

  const slug = body.slug ? slugify(String(body.slug)) : slugify(name);

  const { data: category, error } = await supabase
    .from("Category")
    .insert({ name, slug })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "A category with this name already exists" }, { status: 409 });
  }

  return NextResponse.json({ ok: true, category }, { status: 201 });
}

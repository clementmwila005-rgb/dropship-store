import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { createSession } from "@/lib/auth";
import { ZAMBIAN_PROVINCES } from "@/lib/format";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (name.length < 2) return NextResponse.json({ error: "Name is too short" }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    if (password.length < 8)
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

    const province = String(body.state || "").trim();
    if (!ZAMBIAN_PROVINCES.includes(province))
      return NextResponse.json({ error: "Select a valid Zambian province" }, { status: 400 });

    const { data: existing } = await supabase
      .from("User")
      .select("id")
      .eq("email", email)
      .single();
    if (existing)
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 10);
    const { data: user, error } = await supabase
      .from("User")
      .insert({
        name,
        email,
        passwordHash,
        role: "customer",
        address1: String(body.address1 || "").trim() || null,
        address2: String(body.address2 || "").trim() || null,
        city: String(body.city || "").trim() || null,
        state: province || null,
        zip: String(body.zip || "").trim() || null,
        country: "Zambia",
        phone: String(body.phone || "").trim() || null,
      })
      .select("id, name, email, role")
      .single();

    if (error) throw error;

    await createSession({ id: user.id, name: user.name, email: user.email, role: user.role });

    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) {
    console.error("register error", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

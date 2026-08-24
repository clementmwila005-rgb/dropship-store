import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { createSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password)
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });

    const { data: user } = await supabase
      .from("User")
      .select("*")
      .eq("email", email)
      .single();
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

    await createSession({ id: user.id, name: user.name, email: user.email, role: user.role });

    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } });
  } catch (e: any) {
    console.error("login error", e?.message || e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

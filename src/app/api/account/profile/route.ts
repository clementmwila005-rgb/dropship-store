import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { ZAMBIAN_PROVINCES } from "@/lib/format";

export async function PUT(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json();

  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  const address1 = String(body.address1 || "").trim();
  const city = String(body.city || "").trim();
  const state = String(body.state || "").trim();
  const zip = String(body.zip || "").trim();

  if (!name || !address1 || !city || !ZAMBIAN_PROVINCES.includes(state) || !phone) {
    return NextResponse.json({ error: "Please fill in all required delivery fields" }, { status: 400 });
  }

  const agentName = String(body.agentName || "").trim();
  const agentPhone = String(body.agentPhone || "").trim();
  const agentAddress = String(body.agentAddress || "").trim();
  const agentCity = String(body.agentCity || "").trim();
  const agentProvince = String(body.agentProvince || "").trim();
  const agentZip = String(body.agentZip || "").trim();

  await supabase
    .from("User")
    .update({
      name,
      phone,
      address1,
      address2: body.address2 ? String(body.address2).trim() : null,
      city,
      state,
      zip,
      country: "Zambia",
      agentName: agentName || null,
      agentPhone: agentPhone || null,
      agentAddress: agentAddress || null,
      agentCity: agentCity || null,
      agentProvince: agentProvince || null,
      agentZip: agentZip || null,
    })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}

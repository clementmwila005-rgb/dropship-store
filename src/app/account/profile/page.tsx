import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import ProfileForm from "@/components/ProfileForm";

export const metadata: Metadata = { title: "My profile" };

export default async function ProfilePage() {
  const session = await requireUser();
  if (!session) redirect("/login?next=/account/profile");

  const { data: user } = await supabase
    .from("User")
    .select("*")
    .eq("id", session.id)
    .single();
  if (!user) redirect("/login?next=/account/profile");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/account/orders" className="text-sm text-blue-600 hover:underline">
        ← Track orders
      </Link>
      <h1 className="mt-4 text-3xl font-bold">My profile</h1>
      <p className="mt-1 text-sm text-gray-500">
        Your delivery address and your shipping agent in China are saved and used automatically at checkout.
      </p>
      <div className="mt-8 rounded-xl border border-gray-200 p-6">
        <ProfileForm
          initial={{
            email: user.email,
            name: user.name,
            phone: user.phone ?? "",
            address1: user.address1 ?? "",
            address2: user.address2 ?? "",
            city: user.city ?? "",
            state: user.state ?? "",
            zip: user.zip ?? "",
            agentName: user.agentName ?? "",
            agentPhone: user.agentPhone ?? "",
            agentAddress: user.agentAddress ?? "",
            agentCity: user.agentCity ?? "",
            agentProvince: user.agentProvince ?? "",
            agentZip: user.agentZip ?? "",
          }}
        />
      </div>
    </div>
  );
}

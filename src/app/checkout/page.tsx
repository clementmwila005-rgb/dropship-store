import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import ProductImage from "@/components/ProductImage";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await requireUser();
  if (!user) redirect("/login?next=/checkout");

  const { data: dbUser } = await supabase
    .from("User")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!dbUser) redirect("/login?next=/checkout");

  const { data: cart } = await supabase
    .from("CartItem")
    .select("*, product:Product(*), variant:ProductVariant(*)")
    .eq("userId", user.id)
    .order("createdAt", { ascending: true });

  const items = cart || [];
  if (items.length === 0) redirect("/cart");

  const subtotal = items.reduce(
    (sum, item) => sum + ((item.variant as any)?.priceCents ?? (item.product as any).priceCents) * item.quantity,
    0
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">Checkout</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border border-gray-200 p-6">
          <h2 className="mb-5 text-lg font-semibold">Shipping details</h2>
          <CheckoutForm
            defaultEmail={dbUser.email}
            defaultName={dbUser.name}
            defaults={{
              address1: dbUser.address1 ?? "",
              address2: dbUser.address2 ?? "",
              city: dbUser.city ?? "",
              state: dbUser.state ?? "",
              zip: dbUser.zip ?? "",
              phone: dbUser.phone ?? "",
              agentName: dbUser.agentName ?? "",
              agentPhone: dbUser.agentPhone ?? "",
              agentAddress: dbUser.agentAddress ?? "",
              agentCity: dbUser.agentCity ?? "",
              agentProvince: dbUser.agentProvince ?? "",
              agentZip: dbUser.agentZip ?? "",
            }}
          />
        </div>

        <div className="h-fit rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold">Your order</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  <ProductImage src={(item.product as any).imageUrl} alt={(item.product as any).name} fill />
                </div>
                <div className="flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-gray-900">{(item.product as any).name}</p>
                  {((item.variant as any)?.name || item.variantKey) && (
                    <p className="text-xs text-gray-500">
                      {(item.variant as any)?.name ?? item.variantKey}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">Qty {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold">
                  {formatMoney(((item.variant as any)?.priceCents ?? (item.product as any).priceCents) * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <dl className="mt-5 space-y-2 border-t border-gray-200 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Subtotal</dt>
              <dd className="font-medium">{formatMoney(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Shipping</dt>
              <dd className="font-medium">Free with agent</dd>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatMoney(subtotal)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-gray-500">
            No shipping agent? Tick the box in the form and your order ships to your home address in Zambia. We&apos;ll
            send you the shipping fee via WhatsApp and email.
          </p>
          <Link href="/cart" className="mt-4 block text-center text-sm text-gray-600 hover:underline">
            Edit cart
          </Link>
        </div>
      </div>
    </div>
  );
}

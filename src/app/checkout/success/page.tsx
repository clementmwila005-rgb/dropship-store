import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Order confirmed" };

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const user = await requireUser();
  if (!user) redirect("/login");

  const { order: orderId } = await searchParams;
  if (!orderId) redirect("/account/orders");

  const { data: order } = await supabase
    .from("Order")
    .select("*, items:OrderItem(*, product:Product(slug))")
    .eq("id", orderId)
    .single();

  if (!order || order.userId !== user.id) redirect("/account/orders");

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">✓</div>
      <h1 className="mt-4 text-3xl font-bold">Thank you for your order!</h1>
      <p className="mt-2 text-gray-600">
        Your payment was successful. Order <span className="font-semibold text-gray-900">{order.number}</span> is now
        being processed.
      </p>

      <div className="mt-8 rounded-xl border border-gray-200 p-6 text-left">
        <h2 className="text-lg font-semibold">Order summary</h2>
        <div className="mt-4 space-y-3">
          {(order.items as any[]).map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {item.product?.slug ? (
                  <Link href={`/products/${item.product.slug}`} className="text-blue-600 hover:underline">
                    {item.name}
                  </Link>
                ) : (
                  item.name
                )}{" "}
                {item.variantName && <span className="text-gray-400">({item.variantName})</span>}{" "}
                <span className="text-gray-400">× {item.quantity}</span>
              </span>
              <span className="font-medium">{formatMoney(item.priceCents * item.quantity)}</span>
            </div>
          ))}
        </div>
        {order.shipToHome && (
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-gray-700">Shipping (to home)</span>
            <span className="font-medium text-gray-700">Fee sent via WhatsApp</span>
          </div>
        )}
        <div className="mt-4 flex justify-between border-t border-gray-200 pt-3 text-base font-semibold">
          <span>Total</span>
          <span>{formatMoney(order.totalCents)}</span>
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Link href={`/account/orders/${order.id}`} className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700">
          Track your order
        </Link>
        <Link href="/products" className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

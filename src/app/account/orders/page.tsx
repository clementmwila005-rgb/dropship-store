import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { formatMoney, orderStatusLabel, orderStatusColor } from "@/lib/format";

export const metadata: Metadata = { title: "Track orders" };

export default async function OrdersPage() {
  const user = await requireUser();
  if (!user) redirect("/login?next=/account/orders");

  const { data: orders } = await supabase
    .from("Order")
    .select("*, items:OrderItem(*)")
    .eq("userId", user.id)
    .order("createdAt", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">Track orders</h1>
      <p className="mt-1 text-gray-600">Track your orders and view payment status.</p>

      {(!orders || orders.length === 0) ? (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <p className="text-gray-600">You haven&apos;t placed any orders yet.</p>
          <Link href="/products" className="mt-4 inline-block rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="block rounded-xl border border-gray-200 p-5 transition hover:border-gray-300 hover:shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{order.number}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    {(order.items as any[]).reduce((s: number, i: any) => s + i.quantity, 0)} item(s)
                  </span>
                  <span className="font-semibold">{formatMoney(order.totalCents)}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${orderStatusColor(order.status)}`}>
                    {orderStatusLabel(order.status)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

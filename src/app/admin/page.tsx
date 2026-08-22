import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatMoney, orderStatusLabel, orderStatusColor } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [ordersRes, paidOrdersRes, productsRes, customersRes, recentOrdersRes] = await Promise.all([
    supabase.from("Order").select("id", { count: "exact", head: true }),
    supabase.from("Order").select("totalCents").in("status", ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"]),
    supabase.from("Product").select("id", { count: "exact", head: true }),
    supabase.from("User").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase
      .from("Order")
      .select("*, items:OrderItem(*)")
      .order("createdAt", { ascending: false })
      .limit(8),
  ]);

  const orderCount = ordersRes.count ?? 0;
  const paidOrders = paidOrdersRes.data || [];
  const productCount = productsRes.count ?? 0;
  const customerCount = customersRes.count ?? 0;
  const recentOrders = recentOrdersRes.data || [];

  const revenueCents = paidOrders.reduce((sum, o) => sum + o.totalCents, 0);

  const stats = [
    { label: "Revenue", value: formatMoney(revenueCents) },
    { label: "Orders", value: String(orderCount) },
    { label: "Products", value: String(productCount) },
    { label: "Customers", value: String(customerCount) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/admin/products/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
          + New product
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href="/admin/orders" className="font-medium text-blue-600 hover:underline">
                      {o.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{o.name}</td>
                  <td className="px-4 py-3 font-medium">{formatMoney(o.totalCents)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${orderStatusColor(o.status)}`}>
                      {orderStatusLabel(o.status)}
                    </span>
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

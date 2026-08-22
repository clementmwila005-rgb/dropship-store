import { supabase } from "@/lib/supabase";
import { formatMoney, orderStatusLabel, orderStatusColor, paymentMethodLabel } from "@/lib/format";
import OrderActions from "@/components/admin/OrderActions";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const { data: orders } = await supabase
    .from("Order")
    .select("*, items:OrderItem(*, product:Product(slug)), user:User(email)")
    .order("createdAt", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold">Orders</h1>
      <p className="mt-1 text-sm text-gray-500">
        When an order is paid, buy the item from your supplier and paste the tracking number here.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Tracking</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(orders || []).map((o) => {
              const items = (o.items as any[]) || [];
              return (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{o.number}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-900">{o.name}</p>
                    <p className="text-xs text-gray-400">{(o.user as any)?.email ?? o.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {items.length} line(s), {items.reduce((s: number, i: any) => s + i.quantity, 0)} unit(s)
                  </td>
                  <td className="px-4 py-3 font-medium">{formatMoney(o.totalCents)}</td>
                  <td className="px-4 py-3 text-gray-600">{paymentMethodLabel(o.paymentMethod)}</td>
                  <td className="px-4 py-3">
                    {o.trackingNumber ? (
                      <span className="text-xs text-gray-700">
                        {o.trackingCarrier ? `${o.trackingCarrier} · ` : ""}
                        {o.trackingNumber}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${orderStatusColor(o.status)}`}>
                      {orderStatusLabel(o.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <OrderActions
                      orderId={o.id}
                      initialStatus={o.status}
                      initialTrackingNumber={o.trackingNumber}
                      initialTrackingCarrier={o.trackingCarrier}
                      paymentMethod={o.paymentMethod}
                      shipToHome={o.shipToHome}
                      whatsappNumber={o.whatsappNumber}
                      items={items.map((item: any) => ({
                        name: item.name,
                        variantName: item.variantName,
                        quantity: item.quantity,
                        slug: item.product?.slug ?? null,
                      }))}
                      shipping={{
                        name: o.name,
                        address1: o.address1,
                        address2: o.address2,
                        city: o.city,
                        state: o.state,
                        zip: o.zip,
                        country: o.country,
                        phone: o.phone,
                        email: o.email,
                      }}
                      agent={{
                        agentName: o.agentName,
                        agentPhone: o.agentPhone,
                        agentAddress: o.agentAddress,
                        agentCity: o.agentCity,
                        agentProvince: o.agentProvince,
                        agentZip: o.agentZip,
                      }}
                    />
                  </td>
                </tr>
              );
            })}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

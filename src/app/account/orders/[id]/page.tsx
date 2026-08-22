import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { formatMoney, orderStatusLabel, orderStatusColor, paymentMethodLabel } from "@/lib/format";
import OrderTimeline from "@/components/OrderTimeline";
import ProductImage from "@/components/ProductImage";

export const metadata: Metadata = { title: "Order" };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  if (!user) redirect("/login?next=/account/orders");

  const { id } = await params;
  const { data: order } = await supabase
    .from("Order")
    .select("*, items:OrderItem(*, product:Product(slug))")
    .eq("id", id)
    .single();

  if (!order || order.userId !== user.id) notFound();

  const items = (order.items as any[]) || [];

  const dateStr = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/account/orders" className="text-sm text-blue-600 hover:underline">
        ← Back to track orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{order.number}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Placed on {dateStr} · Paid by {paymentMethodLabel(order.paymentMethod)}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${orderStatusColor(order.status)}`}>
          {orderStatusLabel(order.status)}
        </span>
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 p-6">
        <OrderTimeline status={order.status} />
      </div>

      {(order.trackingNumber || order.status === "SHIPPED" || order.status === "DELIVERED") && (
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-6">
          <h2 className="text-lg font-semibold text-blue-900">Tracking</h2>
          {order.trackingNumber ? (
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-blue-700/70">Carrier</dt>
                <dd className="font-medium text-blue-900">{order.trackingCarrier || "Courier"}</dd>
              </div>
              <div>
                <dt className="text-blue-700/70">Tracking number</dt>
                <dd className="font-medium text-blue-900">{order.trackingNumber}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-sm text-blue-800">Your order is being shipped. A tracking number will appear here soon.</p>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold">Items</h2>
          <div className="mt-4 space-y-4">
            {items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  <ProductImage src={item.imageUrl} alt={item.name} fill />
                </div>
                <div className="flex-1">
                  {item.product?.slug ? (
                    <Link href={`/products/${item.product.slug}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline">
                      {item.name}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  )}
                  {item.variantName && (
                    <p className="text-xs text-gray-500">Variant: {item.variantName}</p>
                  )}
                  <p className="text-xs text-gray-500">Qty {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold">{formatMoney(item.priceCents * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="h-fit rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold">Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Subtotal</dt>
              <dd className="font-medium">{formatMoney(order.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">{order.shipToHome ? "Shipping (to home)" : "Shipping"}</dt>
              <dd className="font-medium">
                {order.shipToHome ? "Fee via WhatsApp" : "Free"}
              </dd>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatMoney(order.totalCents)}</dd>
            </div>
          </dl>

          <h2 className="mt-6 text-lg font-semibold">Ship to</h2>
          <address className="mt-2 text-sm not-italic text-gray-600">
            {order.name}
            <br />
            {order.address1}
            {order.address2 ? <><br />{order.address2}</> : null}
            <br />
            {[order.city, order.state, order.zip].filter(Boolean).join(", ")}
            <br />
            {order.country}
            {order.phone ? <><br />{order.phone}</> : null}
            <br />
            <a href={`mailto:${order.email}`} className="text-blue-600 hover:underline">{order.email}</a>
          </address>

          {order.shipToHome && (
            <>
              <h2 className="mt-6 text-lg font-semibold">Delivery method</h2>
              <p className="mt-2 text-sm text-gray-600">
                No shipping agent — shipped directly to your home address in Zambia. Your shipping fee will be sent to
                you via WhatsApp and email.
              </p>
              {order.whatsappNumber && (
                <p className="mt-1 text-sm text-gray-600">
                  WhatsApp: <span className="font-medium text-gray-900">{order.whatsappNumber}</span>
                </p>
              )}
            </>
          )}

          {!order.shipToHome && order.agentName && (
            <>
              <h2 className="mt-6 text-lg font-semibold">Shipping agent (China)</h2>
              <address className="mt-2 text-sm not-italic text-gray-600">
                {order.agentName}
                {order.agentPhone ? <><br />{order.agentPhone}</> : null}
                <br />
                {order.agentAddress}
                {[order.agentCity, order.agentProvince, order.agentZip].filter(Boolean).length > 0 ? (
                  <><br />{[order.agentCity, order.agentProvince, order.agentZip].filter(Boolean).join(", ")}</>
                ) : null}
                <br />
                China
              </address>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

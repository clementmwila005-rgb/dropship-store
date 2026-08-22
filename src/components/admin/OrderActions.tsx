"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ORDER_STATUSES, paymentMethodLabel } from "@/lib/format";

export default function OrderActions({
  orderId,
  initialStatus,
  initialTrackingNumber,
  initialTrackingCarrier,
  paymentMethod,
  shipToHome,
  whatsappNumber,
  items,
  shipping,
  agent,
}: {
  orderId: string;
  initialStatus: string;
  initialTrackingNumber: string | null;
  initialTrackingCarrier: string | null;
  paymentMethod: string;
  shipToHome: boolean;
  whatsappNumber: string | null;
  items: { name: string; variantName: string | null; quantity: number; slug: string | null }[];
  shipping: {
    name: string;
    address1: string;
    address2: string | null;
    city: string;
    state: string | null;
    zip: string;
    country: string;
    phone: string | null;
    email: string;
  };
  agent: {
    agentName: string | null;
    agentPhone: string | null;
    agentAddress: string | null;
    agentCity: string | null;
    agentProvince: string | null;
    agentZip: string | null;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber ?? "");
  const [trackingCarrier, setTrackingCarrier] = useState(initialTrackingCarrier ?? "");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (!window.confirm("Delete this pending (unpaid) order? This cannot be undone.")) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(data.error || "Could not delete order");
        return;
      }
      router.refresh();
    } catch {
      window.alert("Couldn't reach the server. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  async function save() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, trackingNumber, trackingCarrier }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Could not update order");
      setBusy(false);
      return;
    }
    setBusy(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          {open ? "Close" : "Manage"}
        </button>
        {initialStatus === "PENDING" && (
          <button
            onClick={remove}
            disabled={deleting}
            className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div
            className="flex max-h-[90vh] w-full max-w-md flex-col rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="px-6 pt-6 text-lg font-semibold">Update order</h3>

            <div className="mt-4 flex-1 space-y-4 overflow-y-auto px-6 pb-6">
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Items to buy from your supplier
              </p>
              <ul className="space-y-1">
                {items.map((item, i) => (
                  <li key={i}>
                    {item.slug ? (
                      <a
                        href={`/products/${item.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {item.name}
                      </a>
                    ) : (
                      item.name
                    )}
                    {item.variantName ? ` (${item.variantName})` : ""} × {item.quantity}
                  </li>
                ))}
              </ul>
              <p className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Delivery address (use this to buy from your supplier)
              </p>
              <p>{shipping.name}</p>
              <p>{shipping.address1}</p>
              {shipping.address2 && <p>{shipping.address2}</p>}
              <p>{[shipping.city, shipping.state, shipping.zip].filter(Boolean).join(", ")}</p>
              <p>{shipping.country}</p>
              {shipping.phone && <p>{shipping.phone}</p>}
              <a href={`mailto:${shipping.email}`} className="text-blue-600 hover:underline">
                {shipping.email}
              </a>
              {shipToHome ? (
                <p className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Delivery method
                </p>
              ) : agent.agentName ? (
                <>
                  <p className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Shipping agent in China (send the goods here)
                  </p>
                  <p>{agent.agentName}</p>
                  {agent.agentPhone && <p>{agent.agentPhone}</p>}
                  {agent.agentAddress && <p>{agent.agentAddress}</p>}
                  {[agent.agentCity, agent.agentProvince, agent.agentZip].filter(Boolean).length > 0 && (
                    <p>{[agent.agentCity, agent.agentProvince, agent.agentZip].filter(Boolean).join(", ")}</p>
                  )}
                  <p>China</p>
                </>
              ) : null}
              {shipToHome && (
                <>
                  <p>
                    No shipping agent — ship straight to the customer&apos;s home. Send the shipping fee to them via{" "}
                    <span className="font-semibold text-gray-900">WhatsApp and email</span>.
                  </p>
                  {whatsappNumber && (
                    <p>
                      WhatsApp:{" "}
                      <a
                        href={`https://wa.me/${whatsappNumber.replace(/[^0-9+]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        {whatsappNumber}
                      </a>
                    </p>
                  )}
                </>
              )}
              <p className="mt-2 border-t border-gray-200 pt-2">
                Payment: <span className="font-semibold text-gray-900">{paymentMethodLabel(paymentMethod)}</span>
              </p>
            </div>

            <label className="mt-4 block text-sm font-medium text-gray-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <label className="mt-4 block text-sm font-medium text-gray-700">Tracking number</label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. LY123456789CN (from your supplier)"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />

            <label className="mt-4 block text-sm font-medium text-gray-700">Carrier</label>
            <input
              type="text"
              value={trackingCarrier}
              onChange={(e) => setTrackingCarrier(e.target.value)}
              placeholder="e.g. YunExpress, DHL, 4PX"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-xl">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={busy}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

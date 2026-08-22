"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CartControls({
  productId,
  variantId,
  variantKey,
  quantity,
}: {
  productId: string;
  variantId?: string | null;
  variantKey?: string | null;
  quantity: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function updateQuantity(qty: number) {
    if (qty < 1) return;
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantId, variantKey, quantity: qty }),
      });
      if (res.status === 401) {
        router.push("/login?next=/cart");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not update quantity");
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/cart/${productId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, variantKey }),
      });
      if (res.status === 401) {
        router.push("/login?next=/cart");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not remove item");
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded-lg border border-gray-300">
        <button
          onClick={() => updateQuantity(quantity - 1)}
          disabled={busy}
          className="px-3 py-1.5 text-gray-600 hover:text-gray-900 disabled:opacity-50"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-medium">{quantity}</span>
        <button
          onClick={() => updateQuantity(quantity + 1)}
          disabled={busy}
          className="px-3 py-1.5 text-gray-600 hover:text-gray-900 disabled:opacity-50"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      <button onClick={remove} disabled={busy} className="text-sm text-red-600 hover:underline disabled:opacity-50">
        Remove
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

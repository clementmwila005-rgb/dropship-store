"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddToCartButton({
  productId,
  quantity = 1,
  variantId,
  variantKey,
  buyNow = false,
  children,
  className,
}: {
  productId: string;
  quantity?: number;
  variantId?: string | null;
  variantKey?: string | null;
  buyNow?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function add() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity, variantId, variantKey }),
      });
      if (res.status === 401) {
        router.push(buyNow ? "/login?next=/checkout" : "/login?next=/products");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not add to cart");
        return;
      }
      router.refresh();
      if (buyNow) {
        router.push("/checkout");
      }
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={add}
        disabled={busy}
        className={
          className ??
          "w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
        }
      >
        {busy ? "Adding…" : children ?? (buyNow ? "Buy now" : "Add to cart")}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

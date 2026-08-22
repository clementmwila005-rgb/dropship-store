"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ReturnInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const order = searchParams.get("order");
  const method = searchParams.get("method") === "mobile_money" ? "mobile_money" : "card";
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!order) {
      router.replace("/cart");
      return;
    }

    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(`/api/lipila/status?order=${order}`, { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as { status?: string };
        if (cancelled) return;
        if (data.status === "PAID" || data.status === "PROCESSING") {
          router.replace(`/checkout/success?order=${order}`);
          return;
        }
        if (data.status === "CANCELLED") {
          router.replace(`/checkout/cancel?order=${order}`);
        }
      } catch {
        // retry on transient errors
      }
    };

    check();
    const interval = setInterval(check, 2000);
    const timeout = setTimeout(() => {
      if (!cancelled) router.replace(`/checkout/cancel?order=${order}`);
    }, 120000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [order, router]);

  async function cancelPayment() {
    if (cancelling || !order) return;
    setCancelling(true);
    try {
      await fetch("/api/lipila/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
    } catch {
      // ignore — navigate to the cancel page regardless
    }
    router.replace(`/checkout/cancel?order=${order}`);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      <h1 className="mt-4 text-xl font-semibold">
        {method === "mobile_money" ? "Waiting for payment…" : "Confirming your payment…"}
      </h1>
      {method === "mobile_money" ? (
        <p className="mt-2 text-sm text-gray-600">
          A payment prompt has been sent to your phone. Enter your Mobile Money PIN to approve it. This page will
          update automatically once the payment is confirmed.
        </p>
      ) : (
        <p className="mt-2 text-sm text-gray-600">
          Please complete the payment on the payment page. This page will update automatically once the payment is
          confirmed.
        </p>
      )}
      <div className="mt-8">
        <button
          type="button"
          onClick={cancelPayment}
          disabled={cancelling}
          className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          {cancelling ? "Cancelling…" : "Cancel payment"}
        </button>
        <p className="mt-3 text-xs text-gray-500">
          If you cancel, ignore any further payment prompts on your phone. Do not enter your PIN.
        </p>
      </div>
    </div>
  );
}

export default function CheckoutReturnPage() {
  return (
    <Suspense>
      <ReturnInner />
    </Suspense>
  );
}

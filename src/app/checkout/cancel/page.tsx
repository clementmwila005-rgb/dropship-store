import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Payment cancelled" };

export default async function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const user = await requireUser();
  const { order } = await searchParams;

  if (user && order) {
    await supabase
      .from("Order")
      .update({ status: "CANCELLED" })
      .eq("id", String(order))
      .eq("userId", user.id)
      .eq("status", "PENDING");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="text-5xl">✕</div>
      <h1 className="mt-4 text-2xl font-bold">Payment cancelled</h1>
      <p className="mt-2 text-gray-600">
        You didn&apos;t complete the payment. Your items are still in your cart if you want to try again.
      </p>
      <p className="mx-auto mt-3 max-w-sm text-sm text-amber-700">
        If you still receive a payment prompt on your phone, ignore it and do not enter your PIN. You are not being
        charged.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/cart" className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700">
          Back to cart
        </Link>
        <Link href="/products" className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

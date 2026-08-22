import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import ProductImage from "@/components/ProductImage";
import CartControls from "@/components/CartControls";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const user = await requireUser();
  if (!user) redirect("/login?next=/cart");

  const { data: cart } = await supabase
    .from("CartItem")
    .select("*, product:Product(*), variant:ProductVariant(*)")
    .eq("userId", user.id)
    .order("createdAt", { ascending: true });

  const items = cart || [];
  const subtotal = items.reduce(
    (sum, item) => sum + ((item.variant as any)?.priceCents ?? (item.product as any).priceCents) * item.quantity,
    0
  );
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">Your cart</h1>

      {items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <p className="text-gray-600">Your cart is empty.</p>
          <Link href="/products" className="mt-4 inline-block rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 rounded-xl border border-gray-200 p-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  <ProductImage src={(item.product as any).imageUrl} alt={(item.product as any).name} fill />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link href={`/products/${(item.product as any).slug}`} className="font-medium text-gray-900 hover:underline">
                      {(item.product as any).name}
                    </Link>
                    {(item.variant as any) && (
                      <p className="text-xs text-gray-500">
                        Variant: <span className="font-medium text-gray-700">{(item.variant as any).name}</span>
                      </p>
                    )}
                    {!(item.variant as any) && item.variantKey && (
                      <p className="text-xs text-gray-500">
                        Variant: <span className="font-medium text-gray-700">{item.variantKey}</span>
                      </p>
                    )}
                    <p className="mt-1 text-sm font-semibold">
                      {formatMoney((item.variant as any)?.priceCents ?? (item.product as any).priceCents)}
                    </p>
                  </div>
                  <CartControls
                    productId={(item.product as any).id}
                    variantId={item.variantId}
                    variantKey={item.variantKey}
                    quantity={item.quantity}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold">Order summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Items ({count})</dt>
                <dd className="font-medium">{formatMoney(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Shipping</dt>
                <dd className="font-medium">Free</dd>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatMoney(subtotal)}</dd>
              </div>
            </dl>
            <Link
              href="/checkout"
              className="mt-6 block rounded-lg bg-blue-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Proceed to checkout
            </Link>
            <Link href="/products" className="mt-3 block text-center text-sm text-gray-600 hover:underline">
              Continue shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

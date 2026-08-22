import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatMoney } from "@/lib/format";
import ProductImage from "@/components/ProductImage";
import { ToggleProductButton, DeleteProductButton } from "@/components/admin/ProductActions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const { data: products } = await supabase
    .from("Product")
    .select("*, category:Category(*)")
    .order("createdAt", { ascending: false });

  // Get order item counts per product
  const { data: orderItems } = await supabase
    .from("OrderItem")
    .select("productId");

  const soldCounts = new Map<string, number>();
  (orderItems || []).forEach((item) => {
    soldCounts.set(item.productId, (soldCounts.get(item.productId) || 0) + 1);
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/admin/products/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
          + New product
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Cost</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Sold</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(products || []).map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <ProductImage src={p.imageUrl} alt={p.name} fill />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">
                        {p.isActive ? "Active" : "Hidden"} · {p.slug}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{(p.category as any)?.name ?? "—"}</td>
                <td className="px-4 py-3 font-medium">{formatMoney(p.priceCents)}</td>
                <td className="px-4 py-3 text-gray-600">{p.costCents != null ? formatMoney(p.costCents) : "—"}</td>
                <td className="px-4 py-3 text-gray-600">{p.stock}</td>
                <td className="px-4 py-3 text-gray-600">{soldCounts.get(p.id) || 0}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <ToggleProductButton id={p.id} isActive={p.isActive} />
                    <Link href={`/admin/products/${p.id}/edit`} className="font-medium text-blue-600 hover:underline">
                      Edit
                    </Link>
                    <DeleteProductButton id={p.id} name={p.name} />
                  </div>
                </td>
              </tr>
            ))}
            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                  No products yet. Create your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

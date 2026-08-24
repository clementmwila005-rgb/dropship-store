import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";

export default async function Home() {
  let products: any[] = [];
  let categories: { id: string; name: string; slug: string }[] = [];

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      supabase
        .from("Product")
        .select("*, variants:ProductVariant(*)")
        .eq("isActive", true)
        .order("createdAt", { ascending: false })
        .limit(12),
      supabase
        .from("Category")
        .select("*")
        .order("name", { ascending: true }),
    ]);

    products = productsRes.data || [];
    categories = categoriesRes.data || [];
  } catch (e) {
    console.error("Homepage query error:", e);
  }

  return (
    <div>
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Shop the latest trends,
            <br />
            delivered to your door
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-blue-100">
            Quality products at unbeatable prices. Fast delivery and secure payments.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/products"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              Shop now
            </Link>
            {categories[0] && (
              <Link
                href={`/products?category=${categories[0].slug}`}
                className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Browse {categories[0].name}
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">New arrivals</h2>
          <Link href="/products" className="text-sm font-medium text-blue-600 hover:underline">
            View all →
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <p className="text-gray-600">No products yet. Add some from the admin dashboard.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

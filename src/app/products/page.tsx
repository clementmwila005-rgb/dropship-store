import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import SortSelect from "@/components/SortSelect";

export const metadata: Metadata = { title: "Shop" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const rawQ = params.q || "";
  const q = rawQ.trim().toLowerCase();
  const categorySlug = params.category || "";
  const sort = params.sort || "newest";

  const { data: categories } = await supabase
    .from("Category")
    .select("*")
    .order("name", { ascending: true });

  const cats = categories || [];
  const activeCategory = cats.find((c) => c.slug === categorySlug);

  let query = supabase
    .from("Product")
    .select("*, category:Category(*), variants:ProductVariant(*)")
    .eq("isActive", true);

  if (q) {
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  }
  if (activeCategory) {
    query = query.eq("categoryId", activeCategory.id);
  }

  if (sort === "price-asc") {
    query = query.order("priceCents", { ascending: true });
  } else if (sort === "price-desc") {
    query = query.order("priceCents", { ascending: false });
  } else {
    query = query.order("createdAt", { ascending: false });
  }

  const { data: products } = await query;
  const prods = products || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">
        {activeCategory ? activeCategory.name : "All products"}
      </h1>
      {q && <p className="mt-1 text-gray-500">Results for &ldquo;{q}&rdquo;</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <form action="/products" method="get" className="relative mr-auto w-full max-w-xs">
          <input
            type="search"
            name="q"
            defaultValue={rawQ}
            placeholder="Search products…"
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 pr-16 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md bg-gray-900 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-700"
          >
            Search
          </button>
        </form>
        <Link
          href="/products"
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            !categorySlug ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </Link>
        {cats.map((c) => (
          <Link
            key={c.id}
            href={`/products?category=${c.slug}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              categorySlug === c.slug ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {c.name}
          </Link>
        ))}
        <SortSelect defaultValue={sort} />
      </div>

      {prods.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <p className="text-gray-600">No products match your filters.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {prods.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

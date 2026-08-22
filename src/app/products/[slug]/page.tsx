import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatMoney } from "@/lib/format";
import ProductImage from "@/components/ProductImage";
import ProductDetailClient from "@/components/ProductDetailClient";

export const metadata: Metadata = { title: "Product" };

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: product } = await supabase
    .from("Product")
    .select("*, category:Category(*), variants:ProductVariant(*), images:ProductImage(*)")
    .eq("slug", slug)
    .single();

  if (!product || !product.isActive) notFound();

  const variants = (product.variants as any[]) || [];
  const images = (product.images as any[]) || [];
  const hasVariants = variants.length > 0;

  const groups = variants.reduce<
    { name: string; options: { id: string; name: string; priceCents: number | null; compareAtCents: number | null; stock: number | null }[] }[]
  >((acc, v) => {
    const name = v.group || "Variants";
    let g = acc.find((x) => x.name === name);
    if (!g) {
      g = { name, options: [] };
      acc.push(g);
    }
    g.options.push({
      id: v.id,
      name: v.name,
      priceCents: v.priceCents,
      compareAtCents: v.compareAtCents,
      stock: v.stock,
    });
    return acc;
  }, []);

  const { data: related } = await supabase
    .from("Product")
    .select("*")
    .eq("isActive", true)
    .eq("categoryId", product.categoryId ?? "")
    .neq("id", product.id)
    .limit(4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        {" / "}
        <Link href="/products" className="hover:text-gray-900">
          Shop
        </Link>
        {(product.category as any) && (
          <>
            {" / "}
            <Link href={`/products?category=${(product.category as any).slug}`} className="hover:text-gray-900">
              {(product.category as any).name}
            </Link>
          </>
        )}
      </nav>

      <ProductDetailClient
        productId={product.id}
        name={product.name}
        imageUrl={product.imageUrl}
        basePriceCents={product.priceCents}
        baseCompareAtCents={product.compareAtCents}
        baseStock={product.stock}
        hasVariants={hasVariants}
        groups={groups}
        images={images
          .sort((a: any, b: any) => a.position - b.position)
          .map((img: any) => ({ id: img.id, url: img.url, variantId: img.variantId }))}
      />

      <div className="prose mt-8 max-w-none">
        <h2 className="text-lg font-semibold text-gray-900">Description</h2>
        <p className="mt-2 whitespace-pre-line text-gray-700">{product.description || "No description provided."}</p>
      </div>

      {product.videoUrl && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Product Video</h2>
          <div className="mt-2 aspect-video w-full max-w-2xl overflow-hidden rounded-xl border border-gray-200">
            {product.videoUrl.includes("youtube.com") || product.videoUrl.includes("youtu.be") ? (
              <iframe
                src={product.videoUrl.replace("watch?v=", "embed/")}
                className="h-full w-full"
                allowFullScreen
                title="Product video"
              />
            ) : product.videoUrl.includes("vimeo.com") ? (
              <iframe
                src={product.videoUrl.replace("vimeo.com/", "player.vimeo.com/video/")}
                className="h-full w-full"
                allowFullScreen
                title="Product video"
              />
            ) : (
              <video
                src={product.videoUrl}
                controls
                className="h-full w-full object-contain bg-black"
              />
            )}
          </div>
        </div>
      )}

      {(related || []).length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">You might also like</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {(related || []).map((p) => (
              <Link key={p.id} href={`/products/${p.slug}`} className="group block overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-lg">
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <ProductImage src={p.imageUrl} alt={p.name} fill className="transition duration-300 group-hover:scale-105" />
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 text-sm font-medium text-gray-900">{p.name}</h3>
                  <p className="mt-2 text-base font-semibold">{formatMoney(p.priceCents)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

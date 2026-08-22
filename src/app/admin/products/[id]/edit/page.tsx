import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase
      .from("Product")
      .select("*, variants:ProductVariant(*), images:ProductImage(*, variant:ProductVariant(name))")
      .eq("id", id)
      .single(),
    supabase
      .from("Category")
      .select("*")
      .order("name", { ascending: true }),
  ]);

  if (!product) notFound();

  const variants = (product.variants as any[]) || [];
  const images = (product.images as any[]) || [];

  return (
    <div>
      <h1 className="text-2xl font-bold">Edit product</h1>
      <div className="mt-6 rounded-xl border border-gray-200 p-6">
        <ProductForm
          initial={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            priceCents: product.priceCents,
            compareAtCents: product.compareAtCents,
            costCents: product.costCents,
            supplierUrl: product.supplierUrl,
            imageUrl: product.imageUrl,
            videoUrl: product.videoUrl,
            moq: product.moq,
            stock: product.stock,
            isActive: product.isActive,
            categoryId: product.categoryId,
            variants: variants.map((v) => ({
              group: v.group,
              name: v.name,
              priceCents: v.priceCents,
              compareAtCents: v.compareAtCents,
              stock: v.stock,
            })),
            images: images
              .sort((a: any, b: any) => a.position - b.position)
              .map((img: any) => ({
                url: img.url,
                variantName: img.variant?.name ?? "",
              })),
          }}
          categories={categories || []}
        />
      </div>
    </div>
  );
}

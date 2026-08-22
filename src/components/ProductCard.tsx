import Link from "next/link";
import ProductImage from "./ProductImage";
import AddToCartButton from "./AddToCartButton";
import { formatMoney } from "@/lib/format";

export default function ProductCard({
  product,
}: {
  product: {
    id: string;
    slug: string;
    name: string;
    priceCents: number;
    compareAtCents: number | null;
    imageUrl: string | null;
    stock: number;
    variants?: { stock: number | null }[];
  };
}) {
  const hasVariants = Boolean(product.variants && product.variants.length > 0);
  const soldOut = hasVariants
    ? !product.variants!.some((v) => (v.stock ?? product.stock) > 0)
    : product.stock <= 0;
  const onSale = product.compareAtCents && product.compareAtCents > product.priceCents;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-lg">
      {soldOut && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
          Sold out
        </span>
      )}
      {onSale && !soldOut && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
          Sale
        </span>
      )}
      <Link href={`/products/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            fill
            className="transition duration-300 group-hover:scale-105"
          />
        </div>
        <div className="p-4">
          <h3 className="line-clamp-2 text-sm font-medium text-gray-900">{product.name}</h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-semibold text-gray-900">{formatMoney(product.priceCents)}</span>
            {onSale && (
              <span className="text-sm text-gray-400 line-through">{formatMoney(product.compareAtCents!)}</span>
            )}
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        {soldOut ? (
          <div className="w-full rounded-lg border border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-400">
            Sold out
          </div>
        ) : hasVariants ? (
          <Link
            href={`/products/${product.slug}`}
            className="block w-full rounded-lg bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-blue-500"
          >
            Choose options
          </Link>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <AddToCartButton productId={product.id} className="w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50">
              Add to cart
            </AddToCartButton>
            <AddToCartButton productId={product.id} buyNow className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">
              Buy now
            </AddToCartButton>
          </div>
        )}
      </div>
    </div>
  );
}

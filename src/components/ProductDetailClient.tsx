"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import ProductImage from "./ProductImage";
import AddToCartButton from "./AddToCartButton";
import VariantPicker, { type VariantGroup } from "./VariantPicker";

export default function ProductDetailClient({
  productId,
  name,
  imageUrl,
  basePriceCents,
  baseCompareAtCents,
  baseStock,
  moq,
  hasVariants,
  groups,
  images,
}: {
  productId: string;
  name: string;
  imageUrl: string | null;
  basePriceCents: number;
  baseCompareAtCents: number | null;
  baseStock: number;
  moq: number;
  hasVariants: boolean;
  groups: VariantGroup[];
  images: { id: string; url: string; variantId: string | null }[];
}) {
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    if (groups.length !== 1) return {};
    const first = groups[0];
    const option = first.options.find((o) => (o.stock ?? baseStock) > 0);
    return option ? { [first.name]: option.id } : {};
  });
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const selectedIds = useMemo(() => new Set(Object.values(selections)), [selections]);

  const galleryImages = useMemo(() => {
    const linked = images.filter((i) => i.variantId && selectedIds.has(i.variantId));
    const unlinked = images.filter((i) => !i.variantId);
    return [...linked, ...unlinked];
  }, [images, selectedIds]);

  const mainUrl = activeImage ?? galleryImages[0]?.url ?? imageUrl;

  function handleChange(next: Record<string, string>) {
    setSelections(next);
    setActiveImage(null);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
          <ProductImage src={mainUrl} alt={name} fill />
        </div>
        {galleryImages.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {galleryImages.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveImage(img.url)}
                className={`relative h-20 w-20 overflow-hidden rounded-lg border-2 bg-gray-100 transition ${
                  activeImage === img.url || (activeImage === null && galleryImages[0]?.url === img.url)
                    ? "border-blue-600"
                    : "border-gray-200 hover:border-blue-400"
                }`}
              >
                <ProductImage src={img.url} alt={name} fill />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
        {hasVariants ? (
          <div className="mt-6">
            <VariantPicker
              productId={productId}
              basePriceCents={basePriceCents}
              baseCompareAtCents={baseCompareAtCents}
              baseStock={baseStock}
              groups={groups}
              selections={selections}
              onChange={handleChange}
            />
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl font-bold">{formatMoney(basePriceCents)}</span>
              {baseCompareAtCents != null && baseCompareAtCents > basePriceCents && (
                <span className="text-lg text-gray-400 line-through">{formatMoney(baseCompareAtCents)}</span>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {baseStock <= 0 ? "Sold out" : `In stock (${baseStock} available)`}
            </p>
            {moq > 1 && (
              <p className="mt-1 text-sm text-amber-600 font-medium">Minimum order: {moq} units</p>
            )}
            <div className="mt-6">
              {baseStock <= 0 ? (
                <div className="w-full max-w-xs rounded-lg bg-gray-100 px-6 py-3 text-center text-sm font-semibold text-gray-400">
                  Sold out
                </div>
              ) : (
                <div className="grid max-w-md grid-cols-2 gap-3">
                  <AddToCartButton productId={productId} quantity={moq} className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50">
                    Add to cart
                  </AddToCartButton>
                  <AddToCartButton productId={productId} quantity={moq} buyNow className="w-full rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">
                    Buy now
                  </AddToCartButton>
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          <p className="font-semibold text-gray-900">Secure payments</p>
          <p className="mt-1">
            Pay safely by card or mobile money. Your payment details are encrypted and protected.
          </p>
        </div>
      </div>
    </div>
  );
}

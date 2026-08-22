"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";
import AddToCartButton from "./AddToCartButton";

export type VariantOption = {
  id: string;
  name: string;
  priceCents: number | null;
  compareAtCents: number | null;
  stock: number | null;
};

export type VariantGroup = {
  name: string;
  options: VariantOption[];
};

export default function VariantPicker({
  productId,
  basePriceCents,
  baseCompareAtCents,
  baseStock,
  groups,
  selections,
  onChange,
}: {
  productId: string;
  basePriceCents: number;
  baseCompareAtCents: number | null;
  baseStock: number;
  groups: VariantGroup[];
  selections?: Record<string, string>;
  onChange?: (selections: Record<string, string>) => void;
}) {
  const isMatrix = groups.length > 1;
  const firstGroup = groups[0];

  const [internalSelections, setInternalSelections] = useState<Record<string, string>>(() => {
    if (isMatrix) return {};
    const first = firstGroup?.options.find((o) => (o.stock ?? baseStock) > 0);
    return first ? { [firstGroup.name]: first.id } : {};
  });

  const controlled = onChange !== undefined;
  const current = controlled ? (selections ?? {}) : internalSelections;

  const selectedOption =
    !isMatrix && firstGroup ? firstGroup.options.find((o) => o.id === current[firstGroup.name]) ?? null : null;

  const priceCents = isMatrix ? basePriceCents : selectedOption?.priceCents ?? basePriceCents;
  const compareAtCents = isMatrix ? baseCompareAtCents : selectedOption?.compareAtCents ?? baseCompareAtCents;
  const stock = isMatrix ? baseStock : selectedOption ? (selectedOption.stock ?? baseStock) : baseStock;
  const soldOut = stock <= 0;
  const onSale = compareAtCents != null && compareAtCents > priceCents;

  const allChosen = groups.every((g) => current[g.name] != null);
  const needsChoices = isMatrix && !allChosen;

  function pick(group: string, optionId: string) {
    if (controlled) {
      onChange!({ ...current, [group]: optionId });
    } else {
      setInternalSelections((s) => ({ ...s, [group]: optionId }));
    }
  }

  const variantKey = groups
    .map((g) => {
      const o = g.options.find((x) => x.id === current[g.name]);
      return o ? o.name : "";
    })
    .filter(Boolean)
    .join(" / ");
  const variantId = !isMatrix && selectedOption ? selectedOption.id : null;

  return (
    <div>
      {groups.map((g) => (
        <div key={g.name} className="mt-4 first:mt-0">
          <p className="text-sm font-semibold text-gray-900">{g.name || "Variants"}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {g.options.map((o) => {
              const oStock = isMatrix ? baseStock : (o.stock ?? baseStock);
              const isSoldOut = oStock <= 0;
              const isSelected = current[g.name] === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => pick(g.name, o.id)}
                  disabled={isSoldOut}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    isSelected
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-blue-400"
                  }`}
                >
                  {o.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mt-4 flex items-baseline gap-3">
        <span className="text-2xl font-bold">{formatMoney(priceCents)}</span>
        {onSale && (
          <span className="text-lg text-gray-400 line-through">{formatMoney(compareAtCents!)}</span>
        )}
        {onSale && (
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
            Save {Math.round(((compareAtCents! - priceCents) / compareAtCents!) * 100)}%
          </span>
        )}
      </div>

      <p className="mt-1 text-sm text-gray-500">
        {soldOut ? "Sold out" : `In stock (${stock} available)`}
      </p>

      {needsChoices && (
        <p className="mt-2 text-sm font-medium text-amber-700">
          Please choose {groups.map((g) => g.name || "an option").join(" and ")}.
        </p>
      )}

      <div className="mt-6">
        {soldOut || needsChoices ? (
          <div className="w-full max-w-xs rounded-lg bg-gray-100 px-6 py-3 text-center text-sm font-semibold text-gray-400">
            {soldOut ? "Sold out" : "Select options"}
          </div>
        ) : (
          <div className="grid max-w-md grid-cols-2 gap-3">
            <AddToCartButton
              productId={productId}
              variantId={variantId}
              variantKey={variantKey}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              Add to cart
            </AddToCartButton>
            <AddToCartButton
              productId={productId}
              variantId={variantId}
              variantKey={variantKey}
              buyNow
              className="w-full rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Buy now
            </AddToCartButton>
          </div>
        )}
      </div>
    </div>
  );
}

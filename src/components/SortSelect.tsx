"use client";

export default function SortSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select
      defaultValue={defaultValue}
      onChange={(e) => {
        const url = new URL(window.location.href);
        url.searchParams.set("sort", e.target.value);
        window.location.href = url.toString();
      }}
      className="ml-auto rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"
    >
      <option value="newest">Newest</option>
      <option value="price-asc">Price: low to high</option>
      <option value="price-desc">Price: high to low</option>
    </select>
  );
}

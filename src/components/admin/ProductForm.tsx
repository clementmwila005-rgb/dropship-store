"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type ProductFormProps = {
  initial?: {
    id: string;
    name: string;
    slug: string;
    description: string;
    priceCents: number;
    compareAtCents: number | null;
    costCents: number | null;
    supplierUrl: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    stock: number;
    isActive: boolean;
    categoryId: string | null;
    variants?: { name: string; group?: string; priceCents: number | null; compareAtCents: number | null; stock: number | null }[];
    images?: { url: string; variantName: string }[];
  };
  categories: { id: string; name: string }[];
};

type VariantDraft = {
  group: string;
  name: string;
  price: string;
  compareAt: string;
  stock: string;
};

type ImageDraft = {
  url: string;
  variantName: string;
};

function toDollars(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

export default function ProductForm({ initial, categories }: ProductFormProps) {
  const router = useRouter();
  const editing = Boolean(initial);

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    price: toDollars(initial?.priceCents),
    compareAt: toDollars(initial?.compareAtCents),
    cost: toDollars(initial?.costCents),
    supplierUrl: initial?.supplierUrl ?? "",
    imageUrl: initial?.imageUrl ?? "",
    videoUrl: initial?.videoUrl ?? "",
    stock: initial?.stock ?? 0,
    isActive: initial?.isActive ?? true,
    categoryId: initial?.categoryId ?? "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<ImageDraft[]>(initial?.images ?? []);
  const [variants, setVariants] = useState<VariantDraft[]>(
    initial?.variants?.map((v) => ({
      group: v.group ?? "",
      name: v.name,
      price: toDollars(v.priceCents),
      compareAt: toDollars(v.compareAtCents),
      stock: v.stock != null ? String(v.stock) : "",
    })) ?? []
  );

  function setVariant(i: number, key: keyof VariantDraft, value: string) {
    setVariants((vs) => vs.map((v, idx) => (idx === i ? { ...v, [key]: value } : v)));
  }

  function addVariant() {
    setVariants((vs) => [...vs, { group: "", name: "", price: "", compareAt: "", stock: "" }]);
  }

  function removeVariant(i: number) {
    setVariants((vs) => vs.filter((_, idx) => idx !== i));
  }

  function setImage(i: number, key: keyof ImageDraft, value: string) {
    setImages((imgs) => imgs.map((img, idx) => (idx === i ? { ...img, [key]: value } : img)));
  }

  function addImage() {
    setImages((imgs) => [...imgs, { url: "", variantName: "" }]);
  }

  function removeImage(i: number) {
    setImages((imgs) => imgs.filter((_, idx) => idx !== i));
  }

  const variantOptions = variants
    .filter((v) => v.name.trim() !== "")
    .map((v) => ({
      name: v.name.trim(),
      label: v.group.trim() ? `${v.group.trim()}: ${v.name.trim()}` : v.name.trim(),
    }));

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const priceNum = Number(form.price) || 0;
  const costNum = Number(form.cost) || 0;
  const margin =
    priceNum > 0 && costNum > 0 ? Math.round(((priceNum - costNum) / priceNum) * 100) : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const payload = {
      ...form,
      videoUrl: form.videoUrl || null,
      isActive: form.isActive,
      categoryId: form.categoryId || null,
      variants: variants
        .filter((v) => v.name.trim() !== "")
        .map((v) => ({
          group: v.group.trim(),
          name: v.name.trim(),
          price: v.price,
          compareAt: v.compareAt,
          stock: v.stock,
        })),
      images: images
        .filter((img) => img.url.trim() !== "")
        .map((img) => ({
          url: img.url.trim(),
          variantName: img.variantName,
        })),
    };

    const res = await fetch(editing ? `/api/admin/products/${initial!.id}` : "/api/admin/products", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error || "Could not save product");
      setBusy(false);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      set("imageUrl", data.url);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function uploadVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "video");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      set("videoUrl", data.url);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setVideoUploading(false);
      if (videoFileInputRef.current) videoFileInputRef.current.value = "";
    }
  }

  async function uploadGalleryImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setGalleryUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      setImages((imgs) => [...imgs, { url: data.url, variantName: "" }]);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setGalleryUploading(false);
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = "";
    }
  }

  const inputCls =
    "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const labelCls = "block text-sm font-medium text-gray-700";

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5">
        <div>
          <label htmlFor="name" className={labelCls}>Product name *</label>
          <input id="name" type="text" required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className={labelCls}>Selling price (ZMW / K) *</label>
            <input id="price" type="number" step="0.01" min="0" required value={form.price} onChange={(e) => set("price", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="compareAt" className={labelCls}>Compare-at price (optional)</label>
            <input id="compareAt" type="number" step="0.01" min="0" value={form.compareAt} onChange={(e) => set("compareAt", e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cost" className={labelCls}>Supplier cost (optional)</label>
            <input id="cost" type="number" step="0.01" min="0" value={form.cost} onChange={(e) => set("cost", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="stock" className={labelCls}>Stock quantity</label>
            <input id="stock" type="number" min="0" value={form.stock} onChange={(e) => set("stock", Number(e.target.value))} className={inputCls} />
          </div>
        </div>

        {margin !== null && (
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
            Profit margin: {margin}% (sell {form.price} − cost {form.cost})
          </div>
        )}

        <div>
          <label htmlFor="description" className={labelCls}>Description</label>
          <textarea id="description" rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} className={inputCls} />
        </div>

        <div>
          <label htmlFor="supplierUrl" className={labelCls}>Supplier URL (AliExpress / 1688 etc.)</label>
          <input id="supplierUrl" type="url" value={form.supplierUrl} onChange={(e) => set("supplierUrl", e.target.value)} placeholder="https://www.aliexpress.com/item/..." className={inputCls} />
        </div>

        <div>
          <label htmlFor="videoUrl" className={labelCls}>Product video</label>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <input
              ref={videoFileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={uploadVideo}
              className="block w-full max-w-xs text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-500"
            />
            {videoUploading && <span className="text-sm text-gray-500">Uploading…</span>}
          </div>
          <p className="mt-1 text-xs text-gray-500">Upload MP4, WebM, or paste a YouTube / Vimeo link below:</p>
          <input id="videoUrl" type="url" value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://youtube.com/watch?v=..." className={inputCls} />
          {form.videoUrl && (
            <div className="mt-2 aspect-video w-full max-w-md overflow-hidden rounded-lg border border-gray-200">
              {form.videoUrl.includes("youtube.com") || form.videoUrl.includes("youtu.be") ? (
                <iframe src={form.videoUrl.replace("watch?v=", "embed/")} className="h-full w-full" allowFullScreen title="Product video" />
              ) : form.videoUrl.includes("vimeo.com") ? (
                <iframe src={form.videoUrl.replace("vimeo.com/", "player.vimeo.com/video/")} className="h-full w-full" allowFullScreen title="Product video" />
              ) : (
                <video src={form.videoUrl} controls className="h-full w-full object-contain bg-black" />
              )}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="imageUrl" className={labelCls}>Main image (shown on product cards)</label>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={uploadImage}
              className="block w-full max-w-xs text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-500"
            />
            {uploading && <span className="text-sm text-gray-500">Uploading…</span>}
          </div>
          <p className="mt-1 text-xs text-gray-500">Or paste an image link below:</p>
          <input id="imageUrl" type="text" value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="Paste the supplier image link, e.g. /uploads/... or https://..." className={inputCls} />
          {form.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.imageUrl} alt="Preview" className="mt-2 h-32 w-32 rounded-lg border border-gray-200 object-cover" />
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className={labelCls}>Variants (optional)</label>
            <button
              type="button"
              onClick={addVariant}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              + Add variant
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            For options customers must choose when buying, e.g. a colour (Green, Blue) or a size (S, M, L). To make
            customers pick from two lists — like a colour <em>and</em> a size — give each row a group name (e.g.{" "}
            <strong>Colour</strong> on the colour rows and <strong>Size</strong> on the size rows). Rows with the same
            group are shown as one list. If a variant has its own price or stock, customers see it on the product page.
          </p>
          <div className="mt-2 space-y-2">
            {variants.map((v, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 p-2">
                <input
                  type="text"
                  value={v.group}
                  onChange={(e) => setVariant(i, "group", e.target.value)}
                  placeholder="Group (e.g. Colour / Size)"
                  title="Same group = shown as one list customers pick from"
                  className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={v.name}
                  onChange={(e) => setVariant(i, "name", e.target.value)}
                  placeholder="Variant name (e.g. Green)"
                  className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={v.price}
                  onChange={(e) => setVariant(i, "price", e.target.value)}
                  placeholder="Price (K)"
                  className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={v.compareAt}
                  onChange={(e) => setVariant(i, "compareAt", e.target.value)}
                  placeholder="Compare-at"
                  className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  value={v.stock}
                  onChange={(e) => setVariant(i, "stock", e.target.value)}
                  placeholder="Stock"
                  className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  className="ml-auto text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className={labelCls}>Gallery images (optional)</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => galleryFileInputRef.current?.click()}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                {galleryUploading ? "Uploading…" : "+ Upload image"}
              </button>
              <button
                type="button"
                onClick={addImage}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                + Add image link
              </button>
            </div>
            <input
              ref={galleryFileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={uploadGalleryImage}
              className="hidden"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Add extra photos for the product page. You can link a photo to a variant so customers see it when they pick
            that option (e.g. the Green one). Leave the variant empty to show the photo for every option.
          </p>
          <div className="mt-2 space-y-2">
            {images.map((img, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 p-2">
                <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                  {img.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <input
                  type="text"
                  value={img.url}
                  onChange={(e) => setImage(i, "url", e.target.value)}
                  placeholder="Paste image link, e.g. /uploads/... or https://..."
                  className="w-72 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <select
                  value={img.variantName}
                  onChange={(e) => setImage(i, "variantName", e.target.value)}
                  className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">All variants</option>
                  {variantOptions.map((v) => (
                    <option key={v.name} value={v.name}>{v.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="ml-auto text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
            {images.length === 0 && (
              <p className="text-sm text-gray-400">No gallery images yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label htmlFor="categoryId" className={labelCls}>Category</label>
          <select id="categoryId" value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className={inputCls}>
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="slug" className={labelCls}>Slug (optional)</label>
          <input id="slug" type="text" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-generated from name" className={inputCls} />
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
          Active (visible in store)
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
        >
          {busy ? "Saving…" : editing ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}

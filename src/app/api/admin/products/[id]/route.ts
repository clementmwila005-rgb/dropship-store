import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";

function toCents(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function parseVariants(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => {
      const name = String((v as { name?: unknown })?.name || "").trim();
      if (!name) return null;
      return {
        group: String((v as { group?: unknown })?.group || "").trim(),
        name,
        priceCents: toCents((v as { price?: unknown })?.price),
        compareAtCents: toCents((v as { compareAt?: unknown })?.compareAt),
        stock: Math.max(0, Number((v as { stock?: unknown })?.stock) || 0),
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);
}

function parseImages(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((img) => {
      const url = String((img as { url?: unknown })?.url || "").trim();
      if (!url) return null;
      return {
        url,
        variantName: String((img as { variantName?: unknown })?.variantName || "").trim(),
      };
    })
    .filter((img): img is NonNullable<typeof img> => img !== null);
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const { data: existing } = await supabase
    .from("Product")
    .select("*")
    .eq("id", id)
    .single();
  if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const body = await req.json();
  const name = String(body.name ?? existing.name).trim();
  const priceCents = toCents(body.price) ?? existing.priceCents;

  const updateData: Record<string, any> = {
    name,
    description: String(body.description ?? existing.description),
    priceCents,
    compareAtCents: body.compareAt !== undefined && body.compareAt !== "" ? toCents(body.compareAt) : existing.compareAtCents,
    costCents: body.cost !== undefined && body.cost !== "" ? toCents(body.cost) : existing.costCents,
    supplierUrl: body.supplierUrl !== undefined ? (String(body.supplierUrl).trim() || null) : existing.supplierUrl,
    imageUrl: body.imageUrl !== undefined ? (String(body.imageUrl).trim() || null) : existing.imageUrl,
    stock: body.stock !== undefined ? Math.max(0, Number(body.stock) || 0) : existing.stock,
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
    categoryId: body.categoryId !== undefined ? (String(body.categoryId) || null) : existing.categoryId,
  };

  if (body.slug) {
    updateData.slug = slugify(String(body.slug));
  }

  const { data: product } = await supabase
    .from("Product")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  // Replace variants if provided
  if (body.variants !== undefined) {
    await supabase.from("ProductVariant").delete().eq("productId", id);
    const variants = parseVariants(body.variants);
    if (variants.length > 0) {
      await supabase.from("ProductVariant").insert(
        variants.map((v) => ({ ...v, productId: id }))
      );
    }
  }

  // Replace images if provided
  if (body.images !== undefined) {
    await supabase.from("ProductImage").delete().eq("productId", id);
    const images = parseImages(body.images);
    if (images.length > 0) {
      const { data: createdVariants } = await supabase
        .from("ProductVariant")
        .select("id, name")
        .eq("productId", id);

      const nameToId = new Map((createdVariants || []).map((v) => [v.name, v.id]));
      await supabase.from("ProductImage").insert(
        images.map((img, i) => ({
          productId: id,
          url: img.url,
          position: i,
          variantId: img.variantName ? (nameToId.get(img.variantName) ?? null) : null,
        }))
      );
    }
  }

  return NextResponse.json({ ok: true, product });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  await supabase.from("Product").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}

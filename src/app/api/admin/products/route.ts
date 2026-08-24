import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";

export const runtime = "nodejs";

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

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const includeInactive = searchParams.get("all") === "1";

  let query = supabase
    .from("Product")
    .select("*, category:Category(*)")
    .order("createdAt", { ascending: false });

  if (!includeInactive) {
    query = query.eq("isActive", true);
  }

  const { data: products } = await query;

  return NextResponse.json({ products: products || [] });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = String(body.name || "").trim();
  const priceCents = toCents(body.price);

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (priceCents === null || priceCents <= 0)
    return NextResponse.json({ error: "Enter a valid price" }, { status: 400 });

  const baseSlug = body.slug ? slugify(String(body.slug)) : slugify(name);
  let slug = baseSlug || "product";
  let i = 1;
  while (true) {
    const { data: existing } = await supabase
      .from("Product")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${i}`;
    i++;
  }

  const { data: product, error: productError } = await supabase
    .from("Product")
    .insert({
      name,
      slug,
      description: String(body.description || ""),
      priceCents,
      compareAtCents: toCents(body.compareAt),
      costCents: toCents(body.cost),
      supplierUrl: body.supplierUrl ? String(body.supplierUrl).trim() : null,
      imageUrl: body.imageUrl ? String(body.imageUrl).trim() : null,
      videoUrl: body.videoUrl ? String(body.videoUrl).trim() : null,
      moq: Math.max(1, Number(body.moq) || 1),
      stock: Math.max(0, Number(body.stock) || 0),
      isActive: body.isActive !== false,
      categoryId: body.categoryId ? String(body.categoryId) : null,
    })
    .select()
    .single();

  if (productError) throw productError;

  // Insert variants
  const variants = parseVariants(body.variants);
  if (variants.length > 0) {
    await supabase.from("ProductVariant").insert(
      variants.map((v) => ({ ...v, productId: product.id }))
    );
  }

  // Insert images
  const images = parseImages(body.images);
  if (images.length > 0) {
    const { data: createdVariants } = await supabase
      .from("ProductVariant")
      .select("id, name")
      .eq("productId", product.id);

    const nameToId = new Map((createdVariants || []).map((v) => [v.name, v.id]));
    await supabase.from("ProductImage").insert(
      images.map((img, i) => ({
        productId: product.id,
        url: img.url,
        position: i,
        variantId: img.variantName ? (nameToId.get(img.variantName) ?? null) : null,
      }))
    );
  }

  return NextResponse.json({ ok: true, product }, { status: 201 });
}

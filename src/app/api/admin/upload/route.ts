import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No file selected" }, { status: 400 });
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Use PNG, JPG, WebP or GIF." },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File is too large (max 5 MB)" }, { status: 400 });
    }

    const ext = EXT[file.type];
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());

    // For now, store as base64 data URL in Supabase Storage or use local path
    // TODO: Replace with Cloudflare R2 upload when R2 is configured
    const bucketName = "product-images";

    // Try Supabase Storage first
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(name, buf, { contentType: file.type });

    if (uploadError) {
      // Fallback: store as data URL reference (for initial setup without storage bucket)
      // You'll need to create the "product-images" bucket in Supabase Dashboard → Storage
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed. Please create a 'product-images' bucket in Supabase Storage." }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(name);

    return NextResponse.json({ ok: true, url: urlData.publicUrl });
  } catch (e) {
    console.error("upload error", e);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}

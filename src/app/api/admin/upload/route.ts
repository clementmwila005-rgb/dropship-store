import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const ALL_TYPES = new Set([...IMAGE_TYPES, ...VIDEO_TYPES]);

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("file");
    const kind = form.get("kind") === "video" ? "video" : "image";

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No file selected" }, { status: 400 });
    }
    if (!ALL_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Use PNG, JPG, WebP, GIF, MP4, WebM or MOV." },
        { status: 400 }
      );
    }

    const isVideo = VIDEO_TYPES.has(file.type);
    const maxSize = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxSize) {
      const limit = isVideo ? "50 MB" : "5 MB";
      return NextResponse.json({ error: `File is too large (max ${limit})` }, { status: 400 });
    }

    const bucketName = isVideo ? "product-videos" : "product-images";
    const ext = EXT[file.type] || "bin";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(name, buf, { contentType: file.type });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: `Upload failed. Please create a '${bucketName}' bucket in Supabase Storage.` },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(name);

    return NextResponse.json({ ok: true, url: urlData.publicUrl });
  } catch (e) {
    console.error("upload error", e);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}

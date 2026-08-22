#!/usr/bin/env node
/**
 * migrate-data.mjs
 * 
 * Exports data from the local SQLite database and imports it into Supabase.
 * 
 * Usage:
 *   node scripts/migrate-data.mjs export   — Export SQLite to scripts/export.json
 *   node scripts/migrate-data.mjs import   — Import scripts/export.json into Supabase
 *   node scripts/migrate-data.mjs images   — Upload local images to Supabase Storage
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env first.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const EXPORT_FILE = join(import.meta.dirname, "export.json");

// ─── Export ───────────────────────────────────────────────
async function exportSqlite() {
  console.log("Exporting from local SQLite database...");

  // Dynamically import better-sqlite3
  let Database;
  try {
    const mod = await import("better-sqlite3");
    Database = mod.default;
  } catch {
    console.error("Install better-sqlite3 first: npm install -D better-sqlite3");
    process.exit(1);
  }

  const db = new Database("prisma/dev.db", { readonly: true });

  const tables = [
    "User",
    "Category",
    "Product",
    "ProductVariant",
    "ProductImage",
    "Order",
    "OrderItem",
    "CartItem",
  ];

  const data = {};
  for (const table of tables) {
    // SQLite stores table names as-is from Prisma
    const rows = db.prepare(`SELECT * FROM "${table}"`).all();
    data[table] = rows;
    console.log(`  ${table}: ${rows.length} rows`);
  }

  db.close();

  const { writeFileSync } = await import("fs");
  writeFileSync(EXPORT_FILE, JSON.stringify(data, null, 2));
  console.log(`\nExported to ${EXPORT_FILE}`);
}

// ─── Import ───────────────────────────────────────────────
async function importToSupabase() {
  console.log("Importing data into Supabase...");

  const raw = readFileSync(EXPORT_FILE, "utf-8");
  const data = JSON.parse(raw);

  // Import order matters due to foreign keys
  const importOrder = [
    "User",
    "Category",
    "Product",
    "ProductVariant",
    "ProductImage",
    "Order",
    "OrderItem",
    "CartItem",
  ];

  for (const table of importOrder) {
    const rows = data[table] || [];
    if (rows.length === 0) {
      console.log(`  ${table}: skipping (0 rows)`);
      continue;
    }

    // Remove any SQLite-specific fields that don't exist in PostgreSQL schema
    const cleaned = rows.map((row) => {
      const { _count, ...rest } = row;
      // Convert empty string variants to null for nullable fields where needed
      return rest;
    });

    // Batch insert (Supabase handles up to 1000 rows per insert)
    const BATCH_SIZE = 500;
    for (let i = 0; i < cleaned.length; i += BATCH_SIZE) {
      const batch = cleaned.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from(table).insert(batch);
      if (error) {
        console.error(`  Error inserting ${table} batch ${i}:`, error.message);
      } else {
        console.log(`  ${table}: inserted ${batch.length} rows (${i + batch.length}/${cleaned.length})`);
      }
    }
  }

  console.log("\nImport complete!");
}

// ─── Upload Images ────────────────────────────────────────
async function uploadImages() {
  console.log("Uploading local images to Supabase Storage...");

  const uploadsDir = "public/uploads";
  let files;
  try {
    files = readdirSync(uploadsDir).filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
  } catch {
    console.log("No local images found in public/uploads/");
    return;
  }

  const BUCKET = "product-images";

  // Create bucket if it doesn't exist
  const { error: bucketError } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
  });
  if (bucketError && !bucketError.message.includes("already exists")) {
    console.error("Error creating bucket:", bucketError.message);
  }

  const urlMap = {};

  for (const file of files) {
    const filePath = join(uploadsDir, file);
    const buffer = readFileSync(filePath);

    const { error } = await supabase.storage.from(BUCKET).upload(file, buffer, {
      contentType: getContentType(file),
      upsert: true,
    });

    if (error) {
      console.error(`  Error uploading ${file}:`, error.message);
    } else {
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(file);
      urlMap[`/uploads/${file}`] = urlData.publicUrl;
      console.log(`  Uploaded: ${file}`);
    }
  }

  // Update database URLs
  console.log("\nUpdating image URLs in database...");
  for (const [oldUrl, newUrl] of Object.entries(urlMap)) {
    // Update Product.imageUrl
    await supabase.from("Product").update({ imageUrl: newUrl }).eq("imageUrl", oldUrl);
    // Update ProductImage.url
    await supabase.from("ProductImage").update({ url: newUrl }).eq("url", oldUrl);
    // Update OrderItem.imageUrl
    await supabase.from("OrderItem").update({ imageUrl: newUrl }).eq("imageUrl", oldUrl);
  }

  console.log(`\nUploaded ${files.length} images. URLs updated in database.`);
}

function getContentType(file) {
  const ext = file.split(".").pop().toLowerCase();
  const types = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
  };
  return types[ext] || "application/octet-stream";
}

// ─── Main ─────────────────────────────────────────────────
const cmd = process.argv[2];
switch (cmd) {
  case "export":
    await exportSqlite();
    break;
  case "import":
    await importToSupabase();
    break;
  case "images":
    await uploadImages();
    break;
  default:
    console.log("Usage: node scripts/migrate-data.mjs <export|import|images>");
    process.exit(1);
}

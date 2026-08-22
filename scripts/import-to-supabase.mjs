#!/usr/bin/env node
/**
 * import-to-supabase.mjs
 * Imports export.json into Supabase, fixing SQLite epoch timestamps.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const supabaseUrl = process.env.SUPABASE_URL || "https://iqgktgcuuvqeucryujzz.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxZ2t0Z2N1dXZxZXVjcnl1anp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMzMjAwNSwiZXhwIjoyMTAyOTA4MDA1fQ.UVgxI0TrKXmFlMhLgj0AYSYobD42JD1gI4h0g6Ua1QY";

const supabase = createClient(supabaseUrl, supabaseKey);

const raw = readFileSync(join(import.meta.dirname, "export.json"), "utf-8");
const data = JSON.parse(raw);

// Only these exact column names are datetime fields in each table
const DATE_COLUMNS = {
  User: ["createdAt"],
  Category: [],
  Product: ["createdAt", "updatedAt"],
  ProductVariant: ["createdAt"],
  ProductImage: ["createdAt"],
  Order: ["createdAt", "updatedAt"],
  OrderItem: [],
  CartItem: ["createdAt"],
};

function fixDates(table, row) {
  const fixed = { ...row };
  const dateCols = DATE_COLUMNS[table] || [];
  for (const key of dateCols) {
    const value = fixed[key];
    if (typeof value === "number") {
      fixed[key] = new Date(value).toISOString();
    }
  }
  return fixed;
}

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

  const cleaned = rows.map((row) => {
    const fixed = fixDates(table, row);
    delete fixed._count;
    if (table === "CartItem") {
      delete fixed.updatedAt;
    }
    return fixed;
  });

  const BATCH_SIZE = 500;
  for (let i = 0; i < cleaned.length; i += BATCH_SIZE) {
    const batch = cleaned.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(table).insert(batch);
    if (error) {
      console.error(`  ${table} batch ${i}: ERROR - ${error.message}`);
    } else {
      console.log(`  ${table}: ${batch.length} rows (${i + batch.length}/${cleaned.length})`);
    }
  }
}

console.log("\nImport complete!");

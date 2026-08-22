#!/usr/bin/env node
/**
 * export-sqlite.mjs
 * Exports from local SQLite using Node 24 built-in sqlite module.
 */
import { DatabaseSync } from "node:sqlite";
import { writeFileSync } from "fs";
import { join } from "path";

const db = new DatabaseSync("prisma/dev.db", { open: true, readOnly: true });

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
  const rows = db.prepare(`SELECT * FROM "${table}"`).all();
  data[table] = rows;
  console.log(`  ${table}: ${rows.length} rows`);
}

db.close();

const outPath = join(import.meta.dirname, "export.json");
writeFileSync(outPath, JSON.stringify(data, null, 2));
console.log(`\nExported to ${outPath}`);

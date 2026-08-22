import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Admin account
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin12345";

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: "Store Admin",
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 10),
        role: "admin",
      },
    });
    console.log(`Admin created: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log("Admin already exists, skipping.");
  }

  // Categories
  const categoryNames = ["Electronics", "Fashion", "Home & Garden"];
  const categories = [];
  for (const name of categoryNames) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing) {
      categories.push(await prisma.category.create({ data: { name, slug } }));
      console.log(`Category created: ${name}`);
    } else {
      categories.push(existing);
    }
  }

  // Sample products (only if the store is empty)
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    const samples = [
      {
        name: "Wireless Earbuds Pro",
        description: "True wireless earbuds with noise cancellation and a charging case. Bluetooth 5.3, 30h battery.",
        priceCents: 3499,
        compareAtCents: 5999,
        costCents: 1599,
        supplierUrl: "https://www.aliexpress.com",
        stock: 100,
        category: "Electronics",
      },
      {
        name: "Smart Watch Series X",
        description: "Fitness tracking smartwatch with heart rate, sleep monitoring, and 7-day battery life.",
        priceCents: 4999,
        compareAtCents: 8999,
        costCents: 2299,
        supplierUrl: "https://www.aliexpress.com",
        stock: 50,
        category: "Electronics",
      },
      {
        name: "Unisex Oversized Hoodie",
        description: "Premium cotton oversized hoodie. Available in multiple colors.",
        priceCents: 2999,
        compareAtCents: 4499,
        costCents: 1299,
        supplierUrl: "https://www.aliexpress.com",
        stock: 200,
        category: "Fashion",
      },
      {
        name: "Stainless Steel Water Bottle 1L",
        description: "Insulated bottle keeps drinks cold 24h, hot 12h. Leak-proof lid.",
        priceCents: 1999,
        compareAtCents: 2999,
        costCents: 799,
        supplierUrl: "https://www.aliexpress.com",
        stock: 150,
        category: "Home & Garden",
      },
    ];

    for (const s of samples) {
      const category = categories.find((c) => c.name === s.category);
      const slug = s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await prisma.product.create({
        data: {
          name: s.name,
          slug,
          description: s.description,
          priceCents: s.priceCents,
          compareAtCents: s.compareAtCents,
          costCents: s.costCents,
          supplierUrl: s.supplierUrl,
          stock: s.stock,
          categoryId: category?.id ?? null,
        },
      });
      console.log(`Product created: ${s.name}`);
    }
  } else {
    console.log("Products already exist, skipping sample data.");
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

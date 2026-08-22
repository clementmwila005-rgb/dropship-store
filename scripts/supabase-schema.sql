-- Supabase PostgreSQL schema for DropshipStore
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- User table
-- =============================================
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'customer',
  "address1" TEXT,
  "address2" TEXT,
  "city" TEXT,
  "state" TEXT,
  "zip" TEXT,
  "country" TEXT,
  "phone" TEXT,
  "agentName" TEXT,
  "agentPhone" TEXT,
  "agentAddress" TEXT,
  "agentCity" TEXT,
  "agentProvince" TEXT,
  "agentZip" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Category table
-- =============================================
CREATE TABLE IF NOT EXISTS "Category" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT UNIQUE NOT NULL,
  "slug" TEXT UNIQUE NOT NULL
);

-- =============================================
-- Product table
-- =============================================
CREATE TABLE IF NOT EXISTS "Product" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "priceCents" INTEGER NOT NULL,
  "compareAtCents" INTEGER,
  "costCents" INTEGER,
  "supplierUrl" TEXT,
  "imageUrl" TEXT,
  "stock" INTEGER NOT NULL DEFAULT 100,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "categoryId" TEXT REFERENCES "Category"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ProductVariant table
-- =============================================
CREATE TABLE IF NOT EXISTS "ProductVariant" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
  "group" TEXT NOT NULL DEFAULT '',
  "name" TEXT NOT NULL,
  "priceCents" INTEGER,
  "compareAtCents" INTEGER,
  "stock" INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("productId", "group", "name")
);

-- =============================================
-- ProductImage table
-- =============================================
CREATE TABLE IF NOT EXISTS "ProductImage" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
  "url" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "variantId" TEXT REFERENCES "ProductVariant"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Order table
-- =============================================
CREATE TABLE IF NOT EXISTS "Order" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "number" TEXT UNIQUE NOT NULL,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "address1" TEXT NOT NULL,
  "address2" TEXT,
  "city" TEXT NOT NULL,
  "state" TEXT,
  "zip" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "subtotalCents" INTEGER NOT NULL,
  "shippingCents" INTEGER NOT NULL DEFAULT 0,
  "totalCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'ZMW',
  "paymentMethod" TEXT NOT NULL DEFAULT 'card',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "shipToHome" BOOLEAN NOT NULL DEFAULT FALSE,
  "whatsappNumber" TEXT,
  "trackingNumber" TEXT,
  "trackingCarrier" TEXT,
  "phone" TEXT,
  "agentName" TEXT,
  "agentPhone" TEXT,
  "agentAddress" TEXT,
  "agentCity" TEXT,
  "agentProvince" TEXT,
  "agentZip" TEXT,
  "lipilaReference" TEXT,
  "lipilaIdentifier" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- OrderItem table
-- =============================================
CREATE TABLE IF NOT EXISTS "OrderItem" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId" TEXT NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
  "productId" TEXT,
  "name" TEXT NOT NULL,
  "variantName" TEXT,
  "priceCents" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "imageUrl" TEXT
);

-- =============================================
-- CartItem table
-- =============================================
CREATE TABLE IF NOT EXISTS "CartItem" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
  "variantId" TEXT REFERENCES "ProductVariant"("id") ON DELETE SET NULL,
  "variantKey" TEXT NOT NULL DEFAULT '',
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("userId", "productId", "variantKey")
);

-- =============================================
-- Indexes for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_product_category ON "Product"("categoryId");
CREATE INDEX IF NOT EXISTS idx_product_active ON "Product"("isActive");
CREATE INDEX IF NOT EXISTS idx_product_created ON "Product"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_variant_product ON "ProductVariant"("productId");
CREATE INDEX IF NOT EXISTS idx_image_product ON "ProductImage"("productId");
CREATE INDEX IF NOT EXISTS idx_image_variant ON "ProductImage"("variantId");
CREATE INDEX IF NOT EXISTS idx_order_user ON "Order"("userId");
CREATE INDEX IF NOT EXISTS idx_order_status ON "Order"("status");
CREATE INDEX IF NOT EXISTS idx_order_number ON "Order"("number");
CREATE INDEX IF NOT EXISTS idx_order_lipila_ref ON "Order"("lipilaReference");
CREATE INDEX IF NOT EXISTS idx_order_lipila_id ON "Order"("lipilaIdentifier");
CREATE INDEX IF NOT EXISTS idx_orderitem_order ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS idx_cartitem_user ON "CartItem"("userId");
CREATE INDEX IF NOT EXISTS idx_cartitem_product ON "CartItem"("productId");

-- =============================================
-- Auto-update updatedAt triggers
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_product_updated
  BEFORE UPDATE ON "Product"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_order_updated
  BEFORE UPDATE ON "Order"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

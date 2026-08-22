-- Add payment method column to orders (card | mobile_money)
ALTER TABLE "Order" ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'card';

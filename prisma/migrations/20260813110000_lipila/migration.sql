-- Rename PayPal columns to Lipila equivalents (data preserved)
ALTER TABLE "Order" RENAME COLUMN "paypalOrderId" TO "lipilaReference";
ALTER TABLE "Order" RENAME COLUMN "paypalCaptureId" TO "lipilaIdentifier";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "userId" TEXT,
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
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "trackingNumber" TEXT,
    "trackingCarrier" TEXT,
    "phone" TEXT,
    "paypalOrderId" TEXT,
    "paypalCaptureId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("address1", "address2", "city", "country", "createdAt", "currency", "email", "id", "name", "number", "paypalCaptureId", "paypalOrderId", "phone", "shippingCents", "state", "status", "subtotalCents", "totalCents", "trackingCarrier", "trackingNumber", "updatedAt", "userId", "zip") SELECT "address1", "address2", "city", "country", "createdAt", "currency", "email", "id", "name", "number", "paypalCaptureId", "paypalOrderId", "phone", "shippingCents", "state", "status", "subtotalCents", "totalCents", "trackingCarrier", "trackingNumber", "updatedAt", "userId", "zip" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

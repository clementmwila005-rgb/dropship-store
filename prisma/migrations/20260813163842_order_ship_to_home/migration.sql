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
    "paymentMethod" TEXT NOT NULL DEFAULT 'card',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "shipToHome" BOOLEAN NOT NULL DEFAULT false,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("address1", "address2", "agentAddress", "agentCity", "agentName", "agentPhone", "agentProvince", "agentZip", "city", "country", "createdAt", "currency", "email", "id", "lipilaIdentifier", "lipilaReference", "name", "number", "paymentMethod", "phone", "shippingCents", "state", "status", "subtotalCents", "totalCents", "trackingCarrier", "trackingNumber", "updatedAt", "userId", "zip") SELECT "address1", "address2", "agentAddress", "agentCity", "agentName", "agentPhone", "agentProvince", "agentZip", "city", "country", "createdAt", "currency", "email", "id", "lipilaIdentifier", "lipilaReference", "name", "number", "paymentMethod", "phone", "shippingCents", "state", "status", "subtotalCents", "totalCents", "trackingCarrier", "trackingNumber", "updatedAt", "userId", "zip" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

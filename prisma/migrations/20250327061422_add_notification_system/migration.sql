/*
  Warnings:

  - You are about to drop the column `lastError` on the `NotificationQueue` table. All the data in the column will be lost.
  - You are about to drop the column `messageId` on the `NotificationQueue` table. All the data in the column will be lost.
  - You are about to drop the column `sentAt` on the `NotificationQueue` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NotificationQueue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "winnerId" TEXT NOT NULL,
    "giftCodeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" DATETIME,
    CONSTRAINT "NotificationQueue_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Winner" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_NotificationQueue" ("createdAt", "giftCodeId", "id", "lastRetryAt", "retryCount", "status", "updatedAt", "winnerId") SELECT "createdAt", "giftCodeId", "id", "lastRetryAt", "retryCount", "status", "updatedAt", "winnerId" FROM "NotificationQueue";
DROP TABLE "NotificationQueue";
ALTER TABLE "new_NotificationQueue" RENAME TO "NotificationQueue";
CREATE UNIQUE INDEX "NotificationQueue_winnerId_key" ON "NotificationQueue"("winnerId");
CREATE INDEX "NotificationQueue_status_createdAt_idx" ON "NotificationQueue"("status", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

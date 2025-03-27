/*
  Warnings:

  - You are about to drop the `GiftCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `giftCodeId` on the `Winner` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "GiftCode_code_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GiftCode";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Winner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Winner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Winner_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Winner" ("createdAt", "entryId", "id", "status", "userId") SELECT "createdAt", "entryId", "id", "status", "userId" FROM "Winner";
DROP TABLE "Winner";
ALTER TABLE "new_Winner" RENAME TO "Winner";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

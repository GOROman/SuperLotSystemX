-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "twitterId" TEXT NOT NULL,
    "screenName" TEXT NOT NULL,
    "profileImage" TEXT,
    "isFollower" BOOLEAN NOT NULL DEFAULT false,
    "followedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "retweetId" TEXT NOT NULL,
    "retweetedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "invalidReason" TEXT,
    CONSTRAINT "Entry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Winner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "giftCodeId" TEXT NOT NULL,
    "notifiedAt" DATETIME,
    "dmSentAt" DATETIME,
    "dmMessageId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "Winner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Winner_giftCodeId_fkey" FOREIGN KEY ("giftCodeId") REFERENCES "GiftCode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationQueue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "winnerId" TEXT NOT NULL,
    "giftCodeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "messageId" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "lastRetryAt" DATETIME,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotificationQueue_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Winner" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NotificationQueue_giftCodeId_fkey" FOREIGN KEY ("giftCodeId") REFERENCES "GiftCode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GiftCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "encryptedCode" TEXT,
    "amount" INTEGER NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" DATETIME,
    "expiresAt" DATETIME,
    "note" TEXT
);

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_twitterId_key" ON "User"("twitterId");

-- CreateIndex
CREATE INDEX "User_isFollower_idx" ON "User"("isFollower");

-- CreateIndex
CREATE INDEX "Entry_isValid_createdAt_idx" ON "Entry"("isValid", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_userId_retweetId_key" ON "Entry"("userId", "retweetId");

-- CreateIndex
CREATE UNIQUE INDEX "Winner_giftCodeId_key" ON "Winner"("giftCodeId");

-- CreateIndex
CREATE INDEX "Winner_status_idx" ON "Winner"("status");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationQueue_winnerId_key" ON "NotificationQueue"("winnerId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationQueue_giftCodeId_key" ON "NotificationQueue"("giftCodeId");

-- CreateIndex
CREATE INDEX "NotificationQueue_status_idx" ON "NotificationQueue"("status");

-- CreateIndex
CREATE UNIQUE INDEX "GiftCode_code_key" ON "GiftCode"("code");

-- CreateIndex
CREATE INDEX "GiftCode_isUsed_idx" ON "GiftCode"("isUsed");

-- CreateIndex
CREATE INDEX "SystemLog_type_createdAt_idx" ON "SystemLog"("type", "createdAt");

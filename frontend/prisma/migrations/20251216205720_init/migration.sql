-- CreateTable
CREATE TABLE "Stream" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sender" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "tokenAmount" REAL NOT NULL,
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER NOT NULL,
    "withdrawnAmount" REAL NOT NULL DEFAULT 0,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "pausedAt" INTEGER NOT NULL DEFAULT 0,
    "totalPausedDuration" INTEGER NOT NULL DEFAULT 0,
    "createdAtBlock" INTEGER NOT NULL,
    "tokenType" TEXT NOT NULL DEFAULT 'STX',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

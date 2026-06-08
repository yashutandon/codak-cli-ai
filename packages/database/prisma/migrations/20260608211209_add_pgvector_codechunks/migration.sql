/*
  Warnings:

  - The `part` column on the `Message` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `duration` column on the `Message` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `role` on the `Message` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `Message` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `mode` on the `Message` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ASSISTANT', 'ERROR');

-- CreateEnum
CREATE TYPE "public"."Mode" AS ENUM ('BUILD', 'PLAN');

-- CreateEnum
CREATE TYPE "public"."MessageStatus" AS ENUM ('COMPLETE', 'INTERRUPTED');

-- AlterTable
ALTER TABLE "public"."Message" DROP COLUMN "role",
ADD COLUMN     "role" "public"."Role" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."MessageStatus" NOT NULL,
DROP COLUMN "mode",
ADD COLUMN     "mode" "public"."Mode" NOT NULL,
DROP COLUMN "part",
ADD COLUMN     "part" JSONB,
DROP COLUMN "duration",
ADD COLUMN     "duration" INTEGER;

-- CreateTable
CREATE TABLE "public"."CodeChunk" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(768),
    "startLine" INTEGER NOT NULL,
    "endLine" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CodeChunk_sessionId_idx" ON "public"."CodeChunk"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- AddForeignKey
ALTER TABLE "public"."CodeChunk" ADD CONSTRAINT "CodeChunk_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

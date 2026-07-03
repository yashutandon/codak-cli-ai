-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "isOAuthUser" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "password" DROP NOT NULL;

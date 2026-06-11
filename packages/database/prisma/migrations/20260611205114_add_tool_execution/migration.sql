-- CreateTable
CREATE TABLE "public"."ToolExecution" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "args" JSONB NOT NULL,
    "result" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ToolExecution_sessionId_idx" ON "public"."ToolExecution"("sessionId");

-- AddForeignKey
ALTER TABLE "public"."ToolExecution" ADD CONSTRAINT "ToolExecution_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

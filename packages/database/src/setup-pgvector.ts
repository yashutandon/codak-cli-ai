import { PrismaClient } from "./client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Enabling pgvector extension...");
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);
    console.log("✅ pgvector extension enabled successfully!");
  } catch (err) {
    console.error("Failed to enable pgvector:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

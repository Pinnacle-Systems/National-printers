import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;
const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });

const prisma =
  globalForPrisma.__nationalPrintersPrisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__nationalPrintersPrisma = prisma;
}

export { Prisma, prisma };

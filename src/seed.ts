import { PrismaClient } from "./generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 10;

async function main() {
  console.log("🌱 Starting seed...");

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@example.com" },
  });

  if (existingAdmin) {
    console.log("Admin already exists, skipping...");
  } else {
    // Hash password
    const passwordHash = await bcrypt.hash("Admin123!", SALT_ROUNDS);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: "admin@example.com",
        passwordHash,
        firstName: "Super",
        lastName: "Admin",
        isAdmin: true,
      },
    });

    console.log("Admin created successfully!");
    console.log(`  Email: ${admin.email}`);
    console.log(`  Name: ${admin.firstName} ${admin.lastName}`);
    console.log(`  isAdmin: ${admin.isAdmin}`);
  }

  console.log("🌱 Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });


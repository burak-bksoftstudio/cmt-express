/**
 * Fix Member Roles Script
 * 
 * This script normalizes all ConferenceMember.role values in the database
 * to match the MemberRole enum (uppercase: CHAIR, REVIEWER, AUTHOR).
 * 
 * Run with: npm run fix:roles
 */

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Role mapping: lowercase/invalid → uppercase/valid
const roleMapping: Record<string, string> = {
  // Lowercase variants
  chair: "CHAIR",
  reviewer: "REVIEWER",
  author: "AUTHOR",
  member: "AUTHOR", // "member" maps to AUTHOR (lowest privilege)
  
  // Already correct (no change needed)
  CHAIR: "CHAIR",
  REVIEWER: "REVIEWER",
  AUTHOR: "AUTHOR",
};

interface UpdateResult {
  id: string;
  oldRole: string;
  newRole: string;
}

async function fixMemberRoles() {
  console.log("🔧 Starting ConferenceMember role normalization...\n");

  try {
    // 1. Fetch all ConferenceMember records
    const members = await prisma.conferenceMember.findMany({
      select: {
        id: true,
        role: true,
        user: {
          select: {
            email: true,
          },
        },
        conference: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log(`📊 Found ${members.length} ConferenceMember records.\n`);

    if (members.length === 0) {
      console.log("✅ No records to process. Exiting.");
      return;
    }

    // 2. Process each member
    const updates: UpdateResult[] = [];
    const invalidRoles: { id: string; role: string; email: string }[] = [];
    const alreadyCorrect: string[] = [];

    for (const member of members) {
      const currentRole = member.role as string;
      const normalizedRole = roleMapping[currentRole] || roleMapping[currentRole.toLowerCase()];

      if (!normalizedRole) {
        // Unknown role - will be set to AUTHOR as default
        invalidRoles.push({
          id: member.id,
          role: currentRole,
          email: member.user?.email || "unknown",
        });
        updates.push({
          id: member.id,
          oldRole: currentRole,
          newRole: "AUTHOR",
        });
      } else if (currentRole !== normalizedRole) {
        // Needs update
        updates.push({
          id: member.id,
          oldRole: currentRole,
          newRole: normalizedRole,
        });
      } else {
        // Already correct
        alreadyCorrect.push(member.id);
      }
    }

    // 3. Print summary before updates
    console.log("📋 Analysis Summary:");
    console.log(`   ✓ Already correct: ${alreadyCorrect.length}`);
    console.log(`   ↻ Needs update: ${updates.length}`);
    if (invalidRoles.length > 0) {
      console.log(`   ⚠ Invalid roles found: ${invalidRoles.length}`);
      invalidRoles.forEach((r) => {
        console.log(`      - ID: ${r.id}, Role: "${r.role}", User: ${r.email}`);
      });
    }
    console.log("");

    if (updates.length === 0) {
      console.log("✅ All roles are already normalized. No updates needed.");
      return;
    }

    // 4. Apply updates
    console.log("🔄 Applying updates...\n");

    const updatePromises = updates.map(async (update) => {
      await prisma.conferenceMember.update({
        where: { id: update.id },
        data: { role: update.newRole as any },
      });
      return update;
    });

    const results = await Promise.all(updatePromises);

    // 5. Print detailed results
    console.log("📝 Update Details:");
    console.log("   ┌─────────────────────────────────────────────────┐");
    console.log("   │  Before          →  After                      │");
    console.log("   ├─────────────────────────────────────────────────┤");

    // Group by transformation
    const transformations: Record<string, number> = {};
    results.forEach((r) => {
      const key = `${r.oldRole} → ${r.newRole}`;
      transformations[key] = (transformations[key] || 0) + 1;
    });

    Object.entries(transformations).forEach(([transformation, count]) => {
      const paddedTransformation = transformation.padEnd(30);
      console.log(`   │  ${paddedTransformation} (${count} records) │`);
    });

    console.log("   └─────────────────────────────────────────────────┘\n");

    // 6. Final summary
    console.log("✅ Role normalization complete!");
    console.log(`   Total records processed: ${members.length}`);
    console.log(`   Records updated: ${updates.length}`);
    console.log(`   Records unchanged: ${alreadyCorrect.length}`);

  } catch (error) {
    console.error("❌ Error during role normalization:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixMemberRoles()
  .then(() => {
    console.log("\n🎉 Script finished successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });


import { db } from "../src/db";
import { users } from "../src/db/schema";
import bcrypt from "bcryptjs";

async function seedAdmin() {
    console.log("🌱 Seeding default MANAGER user...");

    const email = "admin@omni.com";
    const username = "Administrator";
    const password = "Admin@123";
    const role = "MANAGER";
    const id = `usr_${Date.now()}`;

    const hashedPassword = await bcrypt.hash(password, 12);

    try {
        await db.insert(users).values({
            id,
            email,
            username,
            password: hashedPassword,
            role,
        });

        console.log("✅ Admin user seeded successfully!");
        console.log(`   📧 Email    : ${email}`);
        console.log(`   👤 Username : ${username}`);
        console.log(`   🔑 Password : ${password}`);
        console.log(`   🎖️  Role     : ${role}`);
        console.log("\n⚠️  PENTING: Segera ganti password setelah login pertama!");
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "";
        if (msg.includes("unique") || msg.includes("duplicate")) {
            console.log("⚠️  User admin sudah ada di database, skip seeding.");
        } else {
            console.error("❌ Failed to seed admin:", error);
            process.exit(1);
        }
    }

    process.exit(0);
}

seedAdmin();

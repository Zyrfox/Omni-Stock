import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const session = await auth();
        // Server-side Check: ONLY Manager can create users
        if ((session?.user as { role?: string })?.role !== "MANAGER") {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

        const body = await req.json();
        const { email, username, password, role } = body;

        if (!email || !username || !password || !role) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        // Check if email or username already exists
        const [existingEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existingEmail) {
            return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
        }

        const [existingUsername] = await db.select().from(users).where(eq(users.username, username)).limit(1);
        if (existingUsername) {
            return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
        }

        // Hash password before inserting!
        const hashedPassword = await bcrypt.hash(password, 12);

        await db.insert(users).values({
            id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            email,
            username,
            password: hashedPassword,
            role,
        });

        return NextResponse.json({ success: true, message: "User created successfully" });
    } catch (error: unknown) {
        console.error("[API_USERS_CREATE] Error creating user:", error);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}

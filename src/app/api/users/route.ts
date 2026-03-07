import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";

export async function GET() {
    try {
        const session = await auth();
        // Server-side Check: ONLY Manager
        if ((session?.user as { role?: string })?.role !== "MANAGER") {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

        const allUsers = await db.select({
            id: users.id,
            email: users.email,
            username: users.username,
            role: users.role,
            created_at: users.created_at,
        }).from(users);

        return NextResponse.json(allUsers);
    } catch (error: unknown) {
        console.error("[API_USERS_GET] Error fetching users:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await auth();
        if ((session?.user as { role?: string })?.role !== "MANAGER") {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "User ID is required" }, { status: 400 });

        // Prevent deleting oneself
        if (id === (session?.user as { id?: string })?.id) {
            return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
        }

        await db.delete(users).where(eq(users.id, id));

        return NextResponse.json({ success: true, message: "User deleted successfully" });
    } catch (error: unknown) {
        console.error("[API_USERS_DELETE] Error deleting user:", error);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}

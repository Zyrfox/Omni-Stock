import { NextResponse } from "next/server";
import { db } from "@/db";
import { masterMenu } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (session?.user?.role !== "MANAGER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const { nama_menu } = body;

        if (!nama_menu || typeof nama_menu !== "string") {
            return NextResponse.json({ error: "Invalid nama_menu" }, { status: 400 });
        }

        await db.update(masterMenu)
            .set({ nama_menu })
            .where(eq(masterMenu.id, id));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Rename menu error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

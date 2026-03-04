export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { db } from "@/db";
import { masterMenu } from "@/db/schema";
import { generateProductId, resolveCategoryPrefix } from "@/lib/outlets";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const prefix = searchParams.get("prefix");
    const category = searchParams.get("category");

    if (!prefix) {
        return NextResponse.json({ error: "Missing prefix" }, { status: 400 });
    }

    // Resolve category prefix
    const catPrefix = resolveCategoryPrefix(category || "Food");

    // Fetch all existing menu IDs from the database
    const menus = await db.select({ id: masterMenu.id }).from(masterMenu);
    const existingIds = menus.map(m => m.id);

    const nextId = generateProductId(prefix, catPrefix, existingIds);

    return NextResponse.json({ nextId, catPrefix });
}


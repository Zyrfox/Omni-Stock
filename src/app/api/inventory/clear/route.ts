import { NextResponse } from 'next/server';
import { db } from '@/db';
import { uploadBatches } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        const latestBatch = await db.select().from(uploadBatches).orderBy(desc(uploadBatches.created_at)).limit(1);

        if (latestBatch.length > 0) {
            await db.update(uploadBatches)
                .set({ archived: true })
                .where(eq(uploadBatches.id, latestBatch[0].id));

            return NextResponse.json({ success: true, message: 'Stock data soft-cleared successfully.' });
        }

        return NextResponse.json({ success: true, message: 'No data to clear.' });
    } catch (error) {
        console.error("[CLEAR_STOCK_API] Error:", error);
        return NextResponse.json({ error: "Failed to clear stock data" }, { status: 500 });
    }
}

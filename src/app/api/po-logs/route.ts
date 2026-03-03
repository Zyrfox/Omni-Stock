import { NextResponse } from 'next/server';
import { db } from '@/db';
import { logPO } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
    try {
        const logs = await db.select().from(logPO).orderBy(desc(logPO.tanggal_po)).limit(50);

        return NextResponse.json(logs);
    } catch (error) {
        console.error("[PO-LOGS] Error:", error);
        return NextResponse.json({ error: 'Failed to fetch PO logs' }, { status: 500 });
    }
}

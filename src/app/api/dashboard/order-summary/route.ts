import { NextResponse } from 'next/server';
import { db } from '@/db';
import { salesHistory } from '@/db/schema';
import { sql, gte } from 'drizzle-orm';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    try {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        // SQLite approach for daily aggregation
        // We group by strftime('%Y-%m-%d', date / 1000, 'unixepoch') because date is stored as JS timestamp
        const aggregation = await db.select({
            date: sql`strftime('%Y-%m-%d', ${salesHistory.date} / 1000, 'unixepoch')`,
            total_orders: sql`SUM(${salesHistory.qty_sold})`,
            revenue: sql`SUM(${salesHistory.revenue})`
        })
            .from(salesHistory)
            .where(gte(salesHistory.date, oneMonthAgo))
            .groupBy(sql`strftime('%Y-%m-%d', ${salesHistory.date} / 1000, 'unixepoch')`)
            .orderBy(sql`strftime('%Y-%m-%d', ${salesHistory.date} / 1000, 'unixepoch') DESC`)
            .limit(days)
            .execute();

        // Recharts expects chronological order usually (Ascending)
        return NextResponse.json(aggregation.reverse());

    } catch (error) {
        console.error("[ORDER_SUMMARY_API] Error:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

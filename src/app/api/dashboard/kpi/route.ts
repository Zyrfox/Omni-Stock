import { NextResponse } from 'next/server';
import { db } from '@/db';
import { uploadBatches, inventoryLogs } from '@/db/schema';
import { fetchMasterData } from '@/lib/gsheets';
import { desc, eq, and, lt } from 'drizzle-orm';

export async function GET() {
    try {
        const masterData = await fetchMasterData();
        const totalProducts = masterData ? masterData.menu.length : 0;

        // Cleanup: Archive batches older than 72 hours
        const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
        await db.update(uploadBatches)
            .set({ archived: true })
            .where(and(eq(uploadBatches.archived, false), lt(uploadBatches.created_at, threeDaysAgo)));

        // PRD V6.1: Real-Time KPI & VS Last Day Trend 
        const todayDate = new Date().toISOString().split('T')[0];
        const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        const [todayBatch] = await db.select().from(uploadBatches)
            .where(and(eq(uploadBatches.date, todayDate), eq(uploadBatches.archived, false)))
            .limit(1);
        const [yesterdayBatch] = await db.select().from(uploadBatches)
            .where(and(eq(uploadBatches.date, yesterdayDate), eq(uploadBatches.archived, false)))
            .limit(1);

        const getStats = async (batchId?: string) => {
            let available = 0, low = 0, out = 0;
            if (!batchId) return { available, low, out };

            const logs = await db.select().from(inventoryLogs).where(eq(inventoryLogs.batch_id, batchId));
            for (const log of logs) {
                if (log.current_stock <= 0) out++;
                else if (log.current_stock <= log.min_stock) low++;
                else available++;
            }
            return { available, low, out };
        };

        const todayStats = await getStats(todayBatch?.id);
        const yesterdayStats = await getStats(yesterdayBatch?.id);

        const calcTrend = (todayVal: number, yesterdayVal: number) => {
            if (yesterdayVal === 0) return todayVal > 0 ? "+100%" : "0%";
            const diff = todayVal - yesterdayVal;
            const pct = (diff / yesterdayVal) * 100;
            return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
        };

        return NextResponse.json({
            total_products: {
                value: totalProducts,
                trend: "0%",
                isPositive: true
            },
            available_stocks: {
                value: todayStats.available,
                trend: calcTrend(todayStats.available, yesterdayStats.available),
                isPositive: todayStats.available >= yesterdayStats.available
            },
            low_stocks: {
                value: todayStats.low,
                trend: calcTrend(todayStats.low, yesterdayStats.low),
                isPositive: todayStats.low <= yesterdayStats.low // Less low stocks is positive
            },
            out_of_stocks: {
                value: todayStats.out,
                trend: calcTrend(todayStats.out, yesterdayStats.out),
                isPositive: todayStats.out <= yesterdayStats.out // Less out of stocks is positive
            }
        });

    } catch (error: unknown) {
        console.error("[KPI_API] Error fetching KPI data:", error);
        return NextResponse.json({ error: 'Failed to fetch KPI' }, { status: 500 });
    }
}

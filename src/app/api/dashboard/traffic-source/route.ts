export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { salesHistory } from '@/db/schema';
import { sql, gte } from 'drizzle-orm';

export async function GET() {
    try {
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

        // Group by source and day
        const srcAggregation = await db.select({
            traffic_source: salesHistory.traffic_source,
            date: sql`strftime('%Y-%m-%d', ${salesHistory.date} / 1000, 'unixepoch')`,
            total_orders: sql`SUM(${salesHistory.qty_sold})`,
        })
            .from(salesHistory)
            .where(gte(salesHistory.date, fourteenDaysAgo))
            .groupBy(salesHistory.traffic_source, sql`strftime('%Y-%m-%d', ${salesHistory.date} / 1000, 'unixepoch')`)
            .orderBy(sql`strftime('%Y-%m-%d', ${salesHistory.date} / 1000, 'unixepoch') ASC`)
            .execute();

        // Reconstruct data into the array of sparkline-friendly values per source
        const grouped: Record<string, any[]> = {};
        const totals: Record<string, number> = {};

        for (const row of srcAggregation) {
            const src = row.traffic_source || "Dine-in";
            if (!grouped[src]) {
                grouped[src] = [];
                totals[src] = 0;
            }
            grouped[src].push({ value: row.total_orders });
            totals[src] += Number(row.total_orders);
        }

        const trafficSources = Object.keys(grouped).map(source => {
            let color = "#6F767E"; // default gray
            if (source.toLowerCase().includes("go")) color = "#00AA13";
            if (source.toLowerCase().includes("grab")) color = "#00B14F";
            if (source.toLowerCase().includes("dine")) color = "#D4FF00";

            // Assume we do an arbitrary trend calculation for simplicity if not enough datapoints
            return {
                name: source,
                total: totals[source].toLocaleString(),
                trend: "+0%", // A more complex sliding win could calculate actual trend
                color: color,
                data: grouped[source].length >= 2 ? grouped[source] : Array.from({ length: 10 }).map(() => ({ value: totals[source] / 10 }))
            };
        });

        if (trafficSources.length === 0) {
            // Return blank structured format if no data
            trafficSources.push({ name: "Dine-in", total: "0", trend: "0%", color: "#D4FF00", data: Array.from({ length: 10 }).map(() => ({ value: 0 })) });
        }

        return NextResponse.json(trafficSources);

    } catch (error) {
        console.error("[TRAFFIC_API] Error:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}


export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { inventoryState, masterBahan, masterMenu } from '@/db/schema';
import { fetchMasterData } from '@/lib/gsheets';
import { count, eq, lt, lte } from 'drizzle-orm';

export async function GET() {
    try {
        const masterData = await fetchMasterData();
        const totalProducts = masterData ? masterData.menu.length : 0;

        // We fetch SQLite inventory states to compare with bounds
        const allStock = await db.select().from(inventoryState);
        let availableStocks = 0;
        let lowStocks = 0;
        let outOfStocks = 0;

        for (const stock of allStock) {
            // Find minimum limit from Master Data
            const bahanMeta = masterData?.bahan.find(b => b.id === stock.id_bahan);
            const minLimit = bahanMeta ? parseFloat(bahanMeta.batas_minimum) : 0;

            availableStocks += stock.current_stock;

            if (stock.current_stock <= 0) {
                outOfStocks++;
            } else if (stock.current_stock <= minLimit) {
                lowStocks++;
            }
        }

        return NextResponse.json({
            total_products: totalProducts,
            available_stocks: availableStocks,
            low_stocks: lowStocks,
            out_of_stocks: outOfStocks
        });

    } catch (error) {
        console.error("[KPI_API] Error fetching KPI data:", error);
        return NextResponse.json({ error: 'Failed to fetch KPI' }, { status: 500 });
    }
}


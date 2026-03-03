import { NextResponse } from 'next/server';
import { db } from '@/db';
import { inventoryState, salesHistory } from '@/db/schema';
import { fetchMasterData } from '@/lib/gsheets';
import { sql, gte } from 'drizzle-orm';

export async function GET() {
    try {
        const masterData = await fetchMasterData();
        if (!masterData) throw new Error("Master Data Not Available");

        // 1. Get past 7 days sales precisely
        const sevenDaysAgoTimestamp = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const recentSales = await db.select()
            .from(salesHistory)
            .where(gte(salesHistory.date, new Date(sevenDaysAgoTimestamp)));

        // 2. Map sales to bahan usage
        const bahanVelocity: Record<string, number> = {};

        for (const sale of recentSales) {
            const matchedMenu = masterData.menu.find(m => m.id_menu === sale.id_menu);
            if (!matchedMenu) continue;

            const relatedReseps = masterData.resep.filter(r => r["nama_menu (Sesuai Pawoon)"] === matchedMenu.nama_menu);
            for (const res of relatedReseps) {
                const matchedBahan = masterData.bahan.find(b => b.nama_bahan === res["nama_bahan (Sesuai Master)"]);
                if (!matchedBahan) continue;

                const usage = parseFloat(res.qty_kurang || "0") * sale.qty_sold;
                const bahanId = matchedBahan.id_bahan;

                if (!bahanVelocity[bahanId]) {
                    bahanVelocity[bahanId] = 0;
                }
                bahanVelocity[bahanId] += usage;
            }
        }

        // 3. Compare with current stock and calculate Days Remaining
        const upcomingRestocks = [];
        const allStock = await db.select().from(inventoryState);

        for (const stock of allStock) {
            const usageLast7Days = bahanVelocity[stock.id_bahan] || 0;
            if (usageLast7Days === 0) continue; // No velocity info

            const dailyVelocity = usageLast7Days / 7;
            const daysRemaining = stock.current_stock / dailyVelocity;

            if (daysRemaining <= 3) {
                const bahanMeta = masterData.bahan.find(b => b.id_bahan === stock.id_bahan);
                upcomingRestocks.push({
                    nama_bahan: bahanMeta ? bahanMeta.nama_bahan : "Unknown",
                    current_stock: stock.current_stock,
                    daily_velocity: dailyVelocity.toFixed(2),
                    days_remaining: daysRemaining.toFixed(1),
                    vendor_id: bahanMeta ? bahanMeta.id_vendor : null
                });
            }
        }

        // Sort by most urgent
        upcomingRestocks.sort((a, b) => parseFloat(a.days_remaining) - parseFloat(b.days_remaining));

        return NextResponse.json(upcomingRestocks);

    } catch (error) {
        console.error("[RESTOCK_API] Error predicting restock:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { uploadBatches, inventoryLogs, salesHistory, masterBahan, masterMenu, mappingResep } from '@/db/schema';
import { sql, gte, eq, desc } from 'drizzle-orm';

export async function GET() {
    try {
        // 1. Get master data from LOCAL DB (no GSheets fetch = instant)
        const allBahan = await db.select().from(masterBahan);
        const allMenu = await db.select().from(masterMenu);
        const allResep = await db.select().from(mappingResep);

        if (allBahan.length === 0) {
            return NextResponse.json([]);
        }

        // 2. Get past 7 days sales
        const sevenDaysAgoTimestamp = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const recentSales = await db.select()
            .from(salesHistory)
            .where(gte(salesHistory.date, new Date(sevenDaysAgoTimestamp)));

        // 3. Map sales to bahan usage via resep mappings
        const bahanVelocity: Record<string, number> = {};

        for (const sale of recentSales) {
            // Find resep entries for this menu
            const relatedReseps = allResep.filter((r: typeof allResep[number]) => r.menu_id === sale.id_menu);
            for (const res of relatedReseps) {
                const bahanId = res.bahan_id;
                const usage = res.jumlah_pakai * sale.qty_sold;

                if (!bahanVelocity[bahanId]) {
                    bahanVelocity[bahanId] = 0;
                }
                bahanVelocity[bahanId] += usage;
            }
        }

        // 4. Compare with current stock and calculate Days Remaining
        const upcomingRestocks = [];

        const [latestBatch] = await db.select().from(uploadBatches).orderBy(desc(uploadBatches.created_at)).limit(1);
        const allStock = latestBatch ? await db.select().from(inventoryLogs).where(eq(inventoryLogs.batch_id, latestBatch.id)) : [];

        for (const stock of allStock) {
            const bahanMeta = allBahan.find((b: typeof allBahan[number]) => b.id === stock.id_bahan);
            if (!bahanMeta) continue;

            // Skip consignment items
            if (bahanMeta.kategori_khusus === 'Consignment') continue;

            const usageLast7Days = bahanVelocity[stock.id_bahan] || 0;

            // Even if no velocity data: if stock below minimum, flag it
            if (usageLast7Days === 0) {
                if (stock.current_stock <= bahanMeta.batas_minimum) {
                    upcomingRestocks.push({
                        nama_bahan: bahanMeta.nama_bahan,
                        current_stock: stock.current_stock,
                        satuan: bahanMeta.satuan_dasar,
                        daily_velocity: "0",
                        days_remaining: stock.current_stock <= 0 ? "0" : "∞",
                        batas_minimum: bahanMeta.batas_minimum,
                        vendor_id: bahanMeta.vendor_id,
                    });
                }
                continue;
            }

            const dailyVelocity = usageLast7Days / 7;
            const daysRemaining = stock.current_stock / dailyVelocity;

            // Show items that will run out within 5 days or below minimum
            if (daysRemaining <= 5 || stock.current_stock <= bahanMeta.batas_minimum) {
                upcomingRestocks.push({
                    nama_bahan: bahanMeta.nama_bahan,
                    current_stock: stock.current_stock,
                    satuan: bahanMeta.satuan_dasar,
                    daily_velocity: dailyVelocity.toFixed(2),
                    days_remaining: daysRemaining.toFixed(1),
                    batas_minimum: bahanMeta.batas_minimum,
                    vendor_id: bahanMeta.vendor_id,
                });
            }
        }

        // Sort by most urgent
        upcomingRestocks.sort((a, b) => {
            const daysA = a.days_remaining === '∞' ? 999 : parseFloat(a.days_remaining);
            const daysB = b.days_remaining === '∞' ? 999 : parseFloat(b.days_remaining);
            return daysA - daysB;
        });

        return NextResponse.json(upcomingRestocks);

    } catch (error: unknown) {
        console.error("[RESTOCK_API] Error predicting restock:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

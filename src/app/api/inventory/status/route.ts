import { NextResponse } from 'next/server';
import { db } from '@/db';
import { uploadBatches, inventoryLogs } from '@/db/schema';
import { fetchMasterData } from '@/lib/gsheets';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
    try {
        const [latestBatch] = await db.select().from(uploadBatches).orderBy(desc(uploadBatches.created_at)).limit(1);
        if (!latestBatch) return NextResponse.json([]);

        const allStock = await db.select().from(inventoryLogs).where(eq(inventoryLogs.batch_id, latestBatch.id));
        const masterData = await fetchMasterData();

        if (!masterData) throw new Error("Master Data Not Available");

        // Map and Merge SQLite actual stock state with GSheets metadata
        const enrichedInventory = allStock.map(stock => {
            const bahanMeta = masterData.bahan.find(b => b.id_bahan === stock.id_bahan);

            return {
                id: stock.id,
                bahan_id: stock.id_bahan,
                nama_bahan: bahanMeta ? bahanMeta.nama_bahan : "Unknown",
                current_stock: stock.current_stock,
                satuan: bahanMeta ? bahanMeta.satuan_dasar : "pcs",
                batas_minimum: bahanMeta ? parseFloat(bahanMeta.Minimal_Stock || "0") : 0,
                vendor_id: bahanMeta ? bahanMeta.id_vendor : null,
                last_updated: latestBatch.created_at
            };
        });

        return NextResponse.json(enrichedInventory);

    } catch (error) {
        console.error("[INVENTORY_API] Error:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

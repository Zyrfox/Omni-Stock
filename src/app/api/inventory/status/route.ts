import { NextResponse } from 'next/server';
import { db } from '@/db';
import { inventoryState } from '@/db/schema';
import { fetchMasterData } from '@/lib/gsheets';

export async function GET() {
    try {
        const allStock = await db.select().from(inventoryState);
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
                last_updated: stock.last_updated
            };
        });

        return NextResponse.json(enrichedInventory);

    } catch (error) {
        console.error("[INVENTORY_API] Error:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { uploadBatches, inventoryLogs, masterBahan, masterVendor } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Get latest upload batch
        const [latestBatch] = await db
            .select()
            .from(uploadBatches)
            .orderBy(desc(uploadBatches.created_at))
            .limit(1);

        if (!latestBatch) {
            return NextResponse.json([]);
        }

        // 2. Join inventoryLogs with Master Data
        const stockData = await db
            .select({
                id_bahan: inventoryLogs.id_bahan,
                nama_bahan: masterBahan.nama_bahan,
                current_stock: inventoryLogs.current_stock,
                min_stock: inventoryLogs.min_stock,
                harga_satuan: masterBahan.harga_satuan,
                vendor_nama: masterVendor.nama_vendor,
                vendor_id: masterBahan.vendor_id,
                kontak_wa: masterVendor.kontak_wa,
                info_pembayaran: masterVendor.info_pembayaran,
                satuan: masterBahan.satuan_dasar
            })
            .from(inventoryLogs)
            .innerJoin(masterBahan, eq(inventoryLogs.id_bahan, masterBahan.id))
            .leftJoin(masterVendor, eq(masterBahan.vendor_id, masterVendor.id))
            .where(eq(inventoryLogs.batch_id, latestBatch.id));

        // 3. Format result
        const result = stockData.map(item => {
            let stockStatus = 'sufficient';
            const { current_stock, min_stock } = item;

            if (current_stock <= 0) stockStatus = 'out';
            else if (current_stock <= min_stock) stockStatus = 'low';
            else if (current_stock <= min_stock * 1.5) stockStatus = 'warning';

            return {
                ...item,
                batas_minimum: min_stock,
                stock_status: stockStatus,
                needs_restock: current_stock <= min_stock,
            };
        });

        // Sort: Out > Low > Warning > Sufficient
        const statusOrder: Record<string, number> = { out: 0, low: 1, warning: 2, sufficient: 3 };
        result.sort((a, b) => statusOrder[a.stock_status] - statusOrder[b.stock_status]);

        return NextResponse.json(result);
    } catch (error) {
        console.error("[PO-WORKBENCH] Error:", error);
        return NextResponse.json({ error: 'Failed to fetch PO workbench data' }, { status: 500 });
    }
}

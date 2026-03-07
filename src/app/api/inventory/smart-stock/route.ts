import { NextResponse } from 'next/server';
import { db } from '@/db';
import { uploadBatches, inventoryLogs } from '@/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { fetchMasterData } from '@/lib/gsheets';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Enforce PRD 6.14: Dirty Data Clearance (archived = false) & 72-Hour TTL
        const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
        const [latestBatch] = await db.select()
            .from(uploadBatches)
            .where(
                and(
                    eq(uploadBatches.archived, false),
                    gte(uploadBatches.created_at, threeDaysAgo)
                )
            )
            .orderBy(desc(uploadBatches.created_at))
            .limit(1);

        // If no valid active batch, return empty array to clear UI tables
        if (!latestBatch) {
            return NextResponse.json([]);
        }

        // 1. Fetch stock ONLY from the active valid batch logs
        const stockData = await db
            .select({
                id_bahan: inventoryLogs.id_bahan,
                current_stock: inventoryLogs.current_stock,
                last_updated: uploadBatches.created_at,
                // We map names directly from Master in step 2
                batas_minimum: inventoryLogs.min_stock,
            })
            .from(inventoryLogs)
            .leftJoin(uploadBatches, eq(inventoryLogs.batch_id, uploadBatches.id))
            .where(eq(inventoryLogs.batch_id, latestBatch.id));

        // 2. Ambil Master Data dari GSheets untuk info Harga_Beli dan Minimal_Stock
        const masterData = await fetchMasterData();
        const bahanMap = new Map<string, Record<string, string | null | undefined>>();
        if (masterData?.bahan) {
            for (const b of masterData.bahan) {
                const record = b as Record<string, unknown>;
                if (typeof record.id_bahan === 'string') {
                    bahanMap.set(record.id_bahan, record as Record<string, string | null | undefined>);
                }
            }
        }

        // 3. Hitung prediksi untuk setiap item
        const result = stockData.map(item => {
            const gsheetsBahan = bahanMap.get(item.id_bahan);
            const minStock = parseFloat(String(item.batas_minimum)) || parseFloat(String(gsheetsBahan?.Minimal_Stock)) || 0;
            const currentStock = item.current_stock || 0;

            // Stok akhir (current) sudah merepresentasikan stok hari ini setelah pemotongan
            // Prediksi PO: jika stok di bawah minimum, hitung berapa yang perlu dipesan
            const needsRestock = currentStock <= minStock;
            const suggestedOrderQty = needsRestock ? Math.max(minStock * 2 - currentStock, minStock) : 0;

            let stockStatus = 'sufficient';
            if (currentStock <= 0) stockStatus = 'out';
            else if (currentStock <= minStock) stockStatus = 'low';
            else if (currentStock <= minStock * 1.5) stockStatus = 'warning';

            return {
                id_bahan: item.id_bahan,
                nama_bahan: gsheetsBahan?.nama_bahan || '---',
                satuan: gsheetsBahan?.satuan_dasar || 'Pcs',
                current_stock: currentStock,
                batas_minimum: minStock,
                vendor_nama: gsheetsBahan?.nama_vendor || 'N/A',
                vendor_id: gsheetsBahan?.id_vendor || '',
                stock_status: stockStatus,
                needs_restock: needsRestock,
                suggested_order_qty: Math.round(suggestedOrderQty),
                last_updated: item.last_updated,
                harga_satuan: parseFloat(String(gsheetsBahan?.Harga_Beli)) || 0,
                kemasan_beli: String(gsheetsBahan?.Kemasan_Beli || 'Pcs'),
                isi_kemasan: parseFloat(String(gsheetsBahan?.Isi_Kemasan)) || 1,
                kontak_wa: gsheetsBahan?.No_WA_Vendor ? String(gsheetsBahan.No_WA_Vendor) : undefined,
            };
        });

        // Sort: Out > Low > Warning > Sufficient
        const statusOrder: Record<string, number> = { out: 0, low: 1, warning: 2, sufficient: 3 };
        result.sort((a, b) => statusOrder[a.stock_status] - statusOrder[b.stock_status]);

        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error("[SMART-STOCK] Error:", error);
        return NextResponse.json({ error: 'Failed to compute smart stock' }, { status: 500 });
    }
}

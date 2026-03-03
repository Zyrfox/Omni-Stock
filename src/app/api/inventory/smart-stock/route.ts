import { NextResponse } from 'next/server';
import { db } from '@/db';
import { inventoryState, masterBahan, masterVendor } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { fetchMasterData } from '@/lib/gsheets';

interface StockRow {
    id_bahan: string;
    current_stock: number;
    last_updated: Date | null;
    nama_bahan: string | null;
    satuan_dasar: string | null;
    batas_minimum: number | null;
    vendor_id: string | null;
    vendor_nama: string | null;
}

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Ambil semua stok dari INVENTORY_STATE (join ke MASTER_BAHAN & MASTER_VENDOR)
        const stockData: StockRow[] = await db
            .select({
                id_bahan: inventoryState.id_bahan,
                current_stock: inventoryState.current_stock,
                last_updated: inventoryState.last_updated,
                nama_bahan: masterBahan.nama_bahan,
                satuan_dasar: masterBahan.satuan_dasar,
                batas_minimum: masterBahan.batas_minimum,
                vendor_id: masterBahan.vendor_id,
                vendor_nama: masterVendor.nama_vendor,
            })
            .from(inventoryState)
            .leftJoin(masterBahan, eq(inventoryState.id_bahan, masterBahan.id))
            .leftJoin(masterVendor, eq(masterBahan.vendor_id, masterVendor.id));

        // 2. Ambil Master Data dari GSheets untuk info Harga_Beli dan Minimal_Stock
        const masterData = await fetchMasterData();
        const bahanMap = new Map<string, any>();
        if (masterData?.bahan) {
            for (const b of masterData.bahan) {
                bahanMap.set(b.id_bahan, b);
            }
        }

        // 3. Hitung prediksi untuk setiap item
        const result = stockData.map(item => {
            const gsheetsBahan = bahanMap.get(item.id_bahan);
            const minStock = item.batas_minimum || parseFloat(gsheetsBahan?.Minimal_Stock || "0");
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
                nama_bahan: item.nama_bahan || gsheetsBahan?.nama_bahan || '---',
                satuan: item.satuan_dasar || gsheetsBahan?.satuan_dasar || 'Pcs',
                current_stock: currentStock,
                batas_minimum: minStock,
                vendor_nama: item.vendor_nama || 'N/A',
                vendor_id: item.vendor_id || '',
                stock_status: stockStatus,
                needs_restock: needsRestock,
                suggested_order_qty: Math.round(suggestedOrderQty),
                last_updated: item.last_updated,
            };
        });

        // Sort: Out > Low > Warning > Sufficient
        const statusOrder: Record<string, number> = { out: 0, low: 1, warning: 2, sufficient: 3 };
        result.sort((a, b) => statusOrder[a.stock_status] - statusOrder[b.stock_status]);

        return NextResponse.json(result);
    } catch (error) {
        console.error("[SMART-STOCK] Error:", error);
        return NextResponse.json({ error: 'Failed to compute smart stock' }, { status: 500 });
    }
}

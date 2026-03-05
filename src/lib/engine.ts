import { db } from "@/db";
import { masterBahan, masterVendor } from "@/db/schema";

export interface KartuStokRow {
    nama_bahan: string;
    stok_awal: number;
    stok_masuk: number;
    stok_keluar: number;
    penjualan: number;
    stok_akhir: number;
    satuan: string;
    kategori: string;
}

export interface MatchedInventoryItem {
    id_bahan: string;
    nama_bahan: string;
    satuan: string;
    current_stock: number;
    batas_minimum: number;
    harga_satuan: number;
    vendor_id: string | null;
    vendor_nama: string;
    kontak_wa: string | null;
    stock_status: "ok" | "low" | "out";
    needs_restock: boolean;
    suggested_order_qty: number;
}

export async function matchKartuStok(items: KartuStokRow[], outletName = "Unknown"): Promise<{
    matchedItems: MatchedInventoryItem[];
    matchedCount: number;
    unmatchedCount: number;
    unmatchedNames: string[];
    outlet: string;
}> {
    console.log(`[ENGINE] Matching ${items.length} Kartu Stok rows from Neon masterBahan...`);

    // ── 1. Fetch master bahan + vendors from Neon ──────────────────────────────
    const [bahanRows, vendorRows] = await Promise.all([
        db.select().from(masterBahan),
        db.select().from(masterVendor),
    ]);

    if (bahanRows.length === 0) {
        throw new Error("Tabel masterBahan kosong! Jalankan 'Sync Master Data' dari Settings terlebih dahulu.");
    }

    // Build lookup maps (normalized)
    const bahanMap = new Map(bahanRows.map(b => [b.nama_bahan.trim().toLowerCase(), b]));
    const vendorMap = new Map(vendorRows.map(v => [v.id, v]));

    // ── 2. Match in memory ─────────────────────────────────────────────────────
    const matchedItems: MatchedInventoryItem[] = [];
    const unmatchedNames: string[] = [];

    for (const item of items) {
        const key = item.nama_bahan.trim().toLowerCase();
        const bahan = bahanMap.get(key);

        if (!bahan) {
            unmatchedNames.push(item.nama_bahan);
            continue;
        }

        const vendor = bahan.vendor_id ? vendorMap.get(bahan.vendor_id) : null;
        const current_stock = item.stok_akhir;
        const min = bahan.batas_minimum ?? 0;
        const stock_status: "ok" | "low" | "out" = current_stock <= 0 ? "out" : current_stock <= min ? "low" : "ok";

        matchedItems.push({
            id_bahan: bahan.id,
            nama_bahan: bahan.nama_bahan,
            satuan: item.satuan || bahan.satuan_dasar,
            current_stock,
            batas_minimum: min,
            harga_satuan: bahan.harga_satuan ?? 0,
            vendor_id: bahan.vendor_id ?? null,
            vendor_nama: vendor?.nama_vendor ?? "—",
            kontak_wa: vendor?.kontak_wa ?? null,
            stock_status,
            needs_restock: stock_status !== "ok",
            suggested_order_qty: stock_status !== "ok" ? Math.max(0, min - current_stock) : 0,
        });
    }

    console.log(`[ENGINE] Done. Matched: ${matchedItems.length}, Unmatched: ${unmatchedNames.length}`);

    return {
        matchedItems,
        matchedCount: matchedItems.length,
        unmatchedCount: unmatchedNames.length,
        unmatchedNames,
        outlet: outletName,
    };
}

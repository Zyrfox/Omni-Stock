import { db } from "@/db";
import { masterBahan, masterVendor, masterMenu, mappingResep } from "@/db/schema";

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
    kemasan_beli: string;
    isi_kemasan: number;
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
            kemasan_beli: bahan.kemasan_beli ?? 'Pcs',
            isi_kemasan: bahan.isi_kemasan ?? 1,
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

export interface ResolvedIngredient {
    bahan_id: string;
    nama_bahan: string;
    qty: number;
}

/**
 * Resolves a given menu/sub-recipe item into its base raw materials (Leaf nodes).
 * Calculates the exact quantity needed across structural depths.
 */
export async function resolveIngredients(itemsToResolve: { itemName: string, qty: number }[]): Promise<ResolvedIngredient[]> {
    // 1. Fetch entire mapping rules into memory safely to avoid exponential DB loops
    const [menus, recipes, bahan] = await Promise.all([
        db.select().from(masterMenu),
        db.select().from(mappingResep),
        db.select().from(masterBahan)
    ]);

    const menuMap = new Map(menus.map(m => [m.nama_menu.toLowerCase().trim(), m.id]));
    const bahanNameMap = new Map(bahan.map(b => [b.nama_bahan.toLowerCase().trim(), b]));
    const bahanIdMap = new Map(bahan.map(b => [b.id, b]));

    // Map Menu ID -> List of Recipe lines
    const recipeMap = new Map<string, typeof recipes>();
    for (const r of recipes) {
        if (!recipeMap.has(r.menu_id)) recipeMap.set(r.menu_id, []);
        recipeMap.get(r.menu_id)!.push(r);
    }

    const aggregated = new Map<string, number>();

    // Recursive helper
    function resolveNode(nodeName: string, multiplier: number, depth: number = 0) {
        if (depth > 10) {
            console.warn(`[BOM] Circular dependency or max depth exceeded for: ${nodeName}`);
            return;
        }

        const cleanName = nodeName.toLowerCase().trim();
        const menuId = menuMap.get(cleanName);

        if (menuId && recipeMap.has(menuId)) {
            // It's a Recipe/Sub-Recipe!
            const compositions = recipeMap.get(menuId)!;
            for (const comp of compositions) {
                // Determine the name of the bahan/sub-recipe for the next recursion
                const childBahan = bahanIdMap.get(comp.bahan_id);
                if (childBahan) {
                    resolveNode(childBahan.nama_bahan, multiplier * comp.jumlah_pakai, depth + 1);
                } else {
                    // Fallback using ID text if name mapper fails
                    resolveNode(comp.bahan_id, multiplier * comp.jumlah_pakai, depth + 1);
                }
            }
        } else {
            // It's a Raw Material (Leaf)
            // Save to aggregator based on actual Bahan ID or Name
            const bTarget = bahanNameMap.get(cleanName);
            const targetId = bTarget ? bTarget.id : cleanName;
            aggregated.set(targetId, (aggregated.get(targetId) || 0) + multiplier);
        }
    }

    // Process all root items array
    for (const item of itemsToResolve) {
        resolveNode(item.itemName, item.qty);
    }

    // Format output
    const results: ResolvedIngredient[] = [];
    for (const [id, totalQty] of aggregated.entries()) {
        const bInfo = bahanIdMap.get(id);
        results.push({
            bahan_id: id,
            nama_bahan: bInfo ? bInfo.nama_bahan : id,
            qty: Number(totalQty.toFixed(4)),
        });
    }

    return results;
}

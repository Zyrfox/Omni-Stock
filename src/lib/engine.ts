import { db } from "@/db";
import { inventoryState, activityLog, logPO, uploadBatches, inventoryLogs, uploadBatchDetails, masterBahan, masterVendor } from "@/db/schema";
import { sendTelegramAlert } from "./alert";
import { eq, inArray } from "drizzle-orm";

export interface KartuStokRow {
    nama_bahan: string;
    stok_awal: number;
    stok_masuk: number;
    stok_keluar: number;
    penjualan: number;
    stok_akhir: number;     // Stok final dari Pawoon (SOURCE OF TRUTH)
    satuan: string;
    kategori: string;
}

export async function processSalesData(items: KartuStokRow[], user = "System", outletName = "Unknown") {
    console.log(`[ENGINE] Processing ${items.length} Kartu Stok rows...`);

    // ── 1. Fetch master data from Neon Postgres (written by Sync) ─────────────
    const bahanRows = await db.select().from(masterBahan);
    console.log(`[ENGINE] Loaded ${bahanRows.length} bahan from Neon Postgres masterBahan table.`);

    if (bahanRows.length === 0) {
        throw new Error("masterBahan tabel kosong! Jalankan 'Sync Master Data' terlebih dahulu dari halaman Settings.");
    }

    // Build a normalized lookup map: lowercase+trim name → row
    const bahanMap = new Map<string, typeof bahanRows[0]>();
    for (const b of bahanRows) {
        bahanMap.set(b.nama_bahan.trim().toLowerCase(), b);
    }

    const lowStockAlerts: { nama_bahan: string; current_stock: number; minimum: number; vendor_id: string }[] = [];

    // ── 2. Create upload batch ────────────────────────────────────────────────
    const batchId = crypto.randomUUID();
    await db.insert(uploadBatches).values({ id: batchId, outlet_id: outletName, status: "processed" });

    // ── 3. Classify items in memory (no extra DB calls per row) ──────────────
    const batchDetails: { id: string; batch_id: string; nama_bahan_raw: string; is_matched: boolean }[] = [];
    const inventoryUpdates: { id_bahan: string; current_stock: number }[] = [];
    const inventoryLogsToInsert: { id: string; batch_id: string; id_bahan: string; current_stock: number; min_stock: number }[] = [];

    let matchedCount = 0;
    let unmatchedCount = 0;

    for (const item of items) {
        // Bulletproof normalization before comparison
        const normalizedName = item.nama_bahan.trim().toLowerCase();
        const matchedBahan = bahanMap.get(normalizedName);

        if (!matchedBahan) {
            console.warn(`[ENGINE] Unmatched: "${item.nama_bahan}" (normalized: "${normalizedName}")`);
            unmatchedCount++;
            batchDetails.push({ id: crypto.randomUUID(), batch_id: batchId, nama_bahan_raw: item.nama_bahan, is_matched: false });
            continue;
        }

        matchedCount++;
        const id_bahan = matchedBahan.id;  // PK in masterBahan is `id`
        const newStock = item.stok_akhir;
        const minStock = matchedBahan.batas_minimum ?? 0;

        batchDetails.push({ id: crypto.randomUUID(), batch_id: batchId, nama_bahan_raw: item.nama_bahan, is_matched: true });
        inventoryUpdates.push({ id_bahan, current_stock: newStock });
        inventoryLogsToInsert.push({ id: crypto.randomUUID(), batch_id: batchId, id_bahan, current_stock: newStock, min_stock: minStock });

        if (newStock <= minStock) {
            lowStockAlerts.push({
                nama_bahan: matchedBahan.nama_bahan,
                current_stock: newStock,
                minimum: minStock,
                vendor_id: matchedBahan.vendor_id || 'N/A'
            });
        }
    }

    // ── 4. Batch insert uploadBatchDetails ────────────────────────────────────
    if (batchDetails.length > 0) {
        await db.insert(uploadBatchDetails).values(batchDetails);
    }

    // ── 5. Bulk upsert inventoryState ─────────────────────────────────────────
    if (inventoryUpdates.length > 0) {
        const ids = inventoryUpdates.map(u => u.id_bahan);
        const existingRows = await db.select({ id_bahan: inventoryState.id_bahan }).from(inventoryState).where(inArray(inventoryState.id_bahan, ids));
        const existingIds = new Set(existingRows.map(r => r.id_bahan));

        const toInsert = inventoryUpdates.filter(u => !existingIds.has(u.id_bahan)).map(u => ({
            id: crypto.randomUUID(), id_bahan: u.id_bahan, current_stock: u.current_stock, last_updated: new Date()
        }));
        const toUpdate = inventoryUpdates.filter(u => existingIds.has(u.id_bahan));

        if (toInsert.length > 0) {
            await db.insert(inventoryState).values(toInsert).onConflictDoNothing();
        }

        if (toUpdate.length > 0) {
            await Promise.all(toUpdate.map(u =>
                db.update(inventoryState)
                    .set({ current_stock: u.current_stock, last_updated: new Date() })
                    .where(eq(inventoryState.id_bahan, u.id_bahan))
            ));
        }
    }

    // ── 6. Batch insert inventoryLogs ─────────────────────────────────────────
    if (inventoryLogsToInsert.length > 0) {
        await db.insert(inventoryLogs).values(inventoryLogsToInsert);
    }

    // ── 7. Activity log ───────────────────────────────────────────────────────
    await db.insert(activityLog).values({
        id: crypto.randomUUID(),
        user,
        action: `Processed ${items.length} Kartu Stok rows. Matched: ${matchedCount}, Unmatched: ${unmatchedCount}.`,
    });

    // ── 8. Draft POs for low stock items ─────────────────────────────────────
    if (lowStockAlerts.length > 0) {
        const poRows = lowStockAlerts.map(alert => {
            const mb = bahanRows.find(b => b.nama_bahan === alert.nama_bahan);
            return mb ? { id: crypto.randomUUID(), bahan_id: mb.id, vendor_id: alert.vendor_id || 'UNKNOWN', status: 'draft' } : null;
        }).filter(Boolean) as { id: string; bahan_id: string; vendor_id: string; status: string }[];

        if (poRows.length > 0) {
            await db.insert(logPO).values(poRows).onConflictDoNothing();
        }

        await db.insert(activityLog).values({
            id: crypto.randomUUID(),
            user: "System",
            action: `Generated ${lowStockAlerts.length} Draft PO(s) for low-stock items.`,
        });

        await sendTelegramAlert(lowStockAlerts);
    }

    console.log(`[ENGINE] Done. Matched: ${matchedCount}, Unmatched: ${unmatchedCount}, Low-stock: ${lowStockAlerts.length}`);
    return { matchedCount, unmatchedCount, lowStockAlerts: lowStockAlerts.length };
}

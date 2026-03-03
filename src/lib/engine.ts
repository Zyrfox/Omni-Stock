import { db } from "@/db";
import { inventoryState, activityLog, logPO } from "@/db/schema";
import { fetchMasterData } from "./gsheets";
import { sendTelegramAlert } from "./alert";
import { eq } from "drizzle-orm";

interface KartuStokRow {
    nama_bahan: string;
    stok_awal: number;
    stok_masuk: number;
    stok_keluar: number;
    penjualan: number;
    stok_akhir: number;     // Stok final dari Pawoon (SOURCE OF TRUTH)
    satuan: string;
    kategori: string;
}

export async function processSalesData(items: KartuStokRow[], user = "System") {
    console.log(`[ENGINE] Processing ${items.length} Kartu Stok rows...`);
    const masterData = await fetchMasterData();

    if (!masterData) throw new Error("Gagal mengambil Master Data dari Google Sheets.");

    const { bahan } = masterData;
    const lowStockAlerts: { nama_bahan: string, current_stock: number, minimum: number, vendor_id: string }[] = [];

    let matchedCount = 0;
    let unmatchedCount = 0;

    for (const item of items) {
        // Direct matching: cocokkan nama bahan dari Kartu Stok ke Master Bahan (case-insensitive)
        const matchedBahan = bahan.find(b =>
            b.nama_bahan.trim().toLowerCase() === item.nama_bahan.trim().toLowerCase()
        );

        if (!matchedBahan) {
            console.warn(`[ENGINE] Bahan tidak ditemukan di Master: ${item.nama_bahan}`);
            unmatchedCount++;
            continue;
        }

        matchedCount++;
        const id_bahan = matchedBahan.id_bahan;

        // LANGSUNG SET stok dari Stok Akhir Pawoon (bukan deduct!)
        // Stok Akhir = sumber kebenaran dari POS Pawoon
        const newStock = item.stok_akhir;

        const existingStock = await db.select().from(inventoryState)
            .where(eq(inventoryState.id_bahan, id_bahan)).get();

        if (existingStock) {
            await db.update(inventoryState)
                .set({ current_stock: newStock, last_updated: new Date() })
                .where(eq(inventoryState.id_bahan, id_bahan));
        } else {
            // Bahan belum ada di INVENTORY_STATE, buat baru
            await db.insert(inventoryState).values({
                id: crypto.randomUUID(),
                id_bahan: id_bahan,
                current_stock: newStock,
                last_updated: new Date(),
            }).onConflictDoNothing();
        }

        const minStock = parseFloat(matchedBahan.Minimal_Stock || "0");

        console.log(`[ENGINE] ✓ ${matchedBahan.nama_bahan}: stok → ${newStock} ${item.satuan} (min: ${minStock})`);

        if (newStock <= minStock) {
            lowStockAlerts.push({
                nama_bahan: matchedBahan.nama_bahan,
                current_stock: newStock,
                minimum: minStock,
                vendor_id: matchedBahan.id_vendor || 'N/A'
            });
        }
    }

    // Record Activity
    await db.insert(activityLog).values({
        id: crypto.randomUUID(),
        user: user,
        action: `Processed ${items.length} Kartu Stok rows. Matched: ${matchedCount}, Unmatched: ${unmatchedCount}.`,
    });

    // Persist Draft PO & Send Telegram Alert
    if (lowStockAlerts.length > 0) {
        for (const alert of lowStockAlerts) {
            try {
                const matchedBahan = bahan.find(b => b.nama_bahan === alert.nama_bahan);
                if (matchedBahan) {
                    await db.insert(logPO).values({
                        id: crypto.randomUUID(),
                        bahan_id: matchedBahan.id_bahan,
                        vendor_id: alert.vendor_id || 'UNKNOWN',
                        status: 'draft',
                    });
                }
            } catch (poError) {
                console.warn(`[ENGINE] Gagal menyimpan Draft PO untuk ${alert.nama_bahan}:`, poError);
            }
        }

        await db.insert(activityLog).values({
            id: crypto.randomUUID(),
            user: "System",
            action: `Generated ${lowStockAlerts.length} Draft PO(s) for low-stock items.`,
        });

        await sendTelegramAlert(lowStockAlerts);
    }

    console.log(`[ENGINE] Selesai. Matched: ${matchedCount}, Unmatched: ${unmatchedCount}, Low-stock: ${lowStockAlerts.length}`);
    return { matchedCount, unmatchedCount, lowStockAlerts: lowStockAlerts.length };
}

'use server'

import { db } from '@/db'
import { masterVendor, masterBahan, masterMenu, mappingResep, inventoryState } from '@/db/schema'
import Papa from 'papaparse'

export async function syncMasterData() {
    try {
        const vendorUrl = process.env.CSV_URL_VENDOR;
        const bahanUrl = process.env.CSV_URL_BAHAN;
        const menuUrl = process.env.CSV_URL_MENU;
        const resepUrl = process.env.CSV_URL_RESEP;

        if (!vendorUrl || !bahanUrl || !menuUrl) {
            console.warn("CSV_URL missing in .env. Falling back to mock data.");
            return mockSyncMasterData();
        }

        const fetchAndParseCSV = async (url: string | undefined) => {
            if (!url) return [];
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch CSV from ${url}`);
            const text = await res.text();
            const result = Papa.parse(text, { header: false, skipEmptyLines: true });
            return result.data.slice(1) as string[][]; // skip header row
        };

        // 1. Fetch ALL CSVs in PARALLEL for speed
        const [vendorRows, bahanRows, menuRows, resepRows] = await Promise.all([
            fetchAndParseCSV(vendorUrl),
            fetchAndParseCSV(bahanUrl),
            fetchAndParseCSV(menuUrl),
            fetchAndParseCSV(resepUrl),
        ]);

        // 2. Clear existing (Order is CRITICAL for SQLite Foreign Keys)
        const { logPO } = await import('@/db/schema');
        await db.delete(logPO).execute();
        await db.delete(mappingResep).execute();
        await db.delete(masterMenu).execute();
        await db.delete(masterBahan).execute();
        await db.delete(masterVendor).execute();

        // 3. Batch Insert Vendors
        const vendorInserts = vendorRows
            .filter(row => row[0] && !row[0].startsWith('---'))
            .map(row => ({
                id: row[0],
                nama_vendor: row[1] || 'Unknown',
                kontak_wa: String(row[3] || '').replace(/[^0-9]/g, ''),
            }));

        if (vendorInserts.length > 0) {
            await db.insert(masterVendor).values(vendorInserts).onConflictDoNothing();
        }

        // 4. Batch Insert Bahan
        const bahanMap = new Map<string, string>();
        const bahanInserts = bahanRows
            .filter(row => row[0] && !row[0].startsWith('---'))
            .map(row => {
                const bahanId = row[0];
                const bahanNama = String(row[1] || '').trim();
                bahanMap.set(bahanNama, bahanId);
                return {
                    id: bahanId,
                    nama_bahan: bahanNama,
                    satuan_dasar: row[2] || 'Pcs',
                    batas_minimum: parseFloat(row[3]) || 10,
                    vendor_id: (row[6] && row[6].trim() !== '' && row[6] !== '---' && row[6] !== '-') ? row[6].trim() : null,
                    kategori_khusus: '',
                };
            });

        if (bahanInserts.length > 0) {
            await db.insert(masterBahan).values(bahanInserts).onConflictDoNothing();
        }

        // 5. Batch Insert Menu
        const menuMap = new Map<string, string>();
        const menuInserts = menuRows
            .filter(row => row[0] && !row[0].startsWith('---'))
            .map(row => {
                const menuId = row[0];
                const menuNama = String(row[1] || '').trim();
                menuMap.set(menuNama, menuId);
                return {
                    id: menuId,
                    nama_menu: menuNama,
                    outlet_id: 'O-001',
                };
            });

        if (menuInserts.length > 0) {
            await db.insert(masterMenu).values(menuInserts).onConflictDoNothing();
        }

        // 6. Batch Insert Resep Mapping
        const resepInserts = resepRows
            .filter(row => row[0] && !row[0].startsWith('---'))
            .map(row => {
                const menuNama = String(row[0]).trim();
                const bahanNama = String(row[1]).trim();
                const menuId = menuMap.get(menuNama);
                const bahanId = bahanMap.get(bahanNama);

                if (menuId && bahanId) {
                    return {
                        id: `r_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                        menu_id: menuId,
                        bahan_id: bahanId,
                        jumlah_pakai: parseFloat(row[2]) || 0,
                        station: row[4] || 'Bar',
                    };
                } else {
                    console.warn(`[Sync Warning] Failed finding match for Recipe: ${menuNama} -> M:${!!menuId} B:${!!bahanId}. Skipping.`);
                    return null;
                }
            })
            .filter(Boolean) as { id: string; menu_id: string; bahan_id: string; jumlah_pakai: number; station: string }[];

        if (resepInserts.length > 0) {
            await db.insert(mappingResep).values(resepInserts).onConflictDoNothing();
        }

        // 7. Seed inventory state for new bahan items
        const existingStates = await db.select().from(inventoryState);
        const existingBahanIds = new Set(existingStates.map(s => s.id_bahan));

        const newBahanForState = bahanInserts
            .filter(b => !existingBahanIds.has(b.id));

        if (newBahanForState.length > 0) {
            await db.insert(inventoryState).values(
                newBahanForState.map(b => ({
                    id: crypto.randomUUID(),
                    id_bahan: b.id,
                    current_stock: 0,
                }))
            );
        }

        console.log(`[Sync] Done: ${vendorInserts.length} vendors, ${bahanInserts.length} bahan, ${menuInserts.length} menu, ${resepInserts.length} resep, ${newBahanForState.length} new inventory states`);
        return { success: true, message: `Synced: ${vendorInserts.length} vendor, ${bahanInserts.length} bahan, ${menuInserts.length} menu, ${resepInserts.length} resep.` };
    } catch (error: Error | unknown) {
        console.error("Sync error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

// Fallback Mock Function
async function mockSyncMasterData() {
    try {
        // 1. Clear existing for mock sync
        const { logPO } = await import('@/db/schema');
        await db.delete(logPO).execute();
        await db.delete(mappingResep).execute();
        await db.delete(masterMenu).execute();
        await db.delete(masterBahan).execute();
        await db.delete(masterVendor).execute();

        // 2. Insert Vendors
        const vendorId1 = `v_${Date.now()}_1`;
        const vendorId2 = `v_${Date.now()}_2`;
        await db.insert(masterVendor).values([
            { id: vendorId1, nama_vendor: 'PT. Aneka Rasa', kontak_wa: '628123456789' },
            { id: vendorId2, nama_vendor: 'CV. Sumber Makmur', kontak_wa: '628987654321' },
        ]);

        // 3. Insert Bahan Baku
        const bahanId1 = `b_${Date.now()}_1`;
        const bahanId2 = `b_${Date.now()}_2`;
        const bahanId3 = `b_${Date.now()}_3`;
        await db.insert(masterBahan).values([
            { id: bahanId1, nama_bahan: 'Kopi Arabica', satuan_dasar: 'Gr', batas_minimum: 1000, vendor_id: vendorId1, kategori_khusus: '' },
            { id: bahanId2, nama_bahan: 'Susu Segar', satuan_dasar: 'mL', batas_minimum: 5000, vendor_id: vendorId2, kategori_khusus: '' },
            { id: bahanId3, nama_bahan: 'Tumbler', satuan_dasar: 'Pcs', batas_minimum: 10, vendor_id: vendorId1, kategori_khusus: 'Consignment' },
        ]);

        // 4. Insert Menu
        const menuId1 = `m_${Date.now()}_1`;
        const menuId2 = `m_${Date.now()}_2`;
        await db.insert(masterMenu).values([
            { id: menuId1, nama_menu: 'Iced Latte', outlet_id: 'O-001' },
            { id: menuId2, nama_menu: 'Tumbler Merchandise', outlet_id: 'O-001' },
        ]);

        // 5. Insert Resep Mapping
        await db.insert(mappingResep).values([
            { id: `r_${Date.now()}_1`, menu_id: menuId1, bahan_id: bahanId1, jumlah_pakai: 15, station: 'Bar' },
            { id: `r_${Date.now()}_2`, menu_id: menuId1, bahan_id: bahanId2, jumlah_pakai: 150, station: 'Bar' },
            { id: `r_${Date.now()}_3`, menu_id: menuId2, bahan_id: bahanId3, jumlah_pakai: 1, station: 'Kasir' },
        ]);

        return { success: true, message: 'Successfully synced master data from Google Sheets (Mock).' };
    } catch (error: Error | unknown) {
        console.error("Sync error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

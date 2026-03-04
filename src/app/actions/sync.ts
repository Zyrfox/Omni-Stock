'use server'

import { db } from '@/db'
import { masterVendor, masterBahan, masterMenu, mappingResep, inventoryState, logPO } from '@/db/schema'
import { sql } from 'drizzle-orm'
import Papa from 'papaparse'

interface SyncUrls {
    CSV_URL_VENDOR?: string;
    CSV_URL_BAHAN?: string;
    CSV_URL_MENU?: string;
    CSV_URL_RESEP?: string;
}

export async function syncMasterData(urls?: SyncUrls) {
    try {
        // Use provided URLs first, fallback to env vars
        const vendorUrl = urls?.CSV_URL_VENDOR?.trim() || process.env.CSV_URL_VENDOR;
        const bahanUrl = urls?.CSV_URL_BAHAN?.trim() || process.env.CSV_URL_BAHAN;
        const menuUrl = urls?.CSV_URL_MENU?.trim() || process.env.CSV_URL_MENU;
        const resepUrl = urls?.CSV_URL_RESEP?.trim() || process.env.CSV_URL_RESEP;

        if (!vendorUrl || !bahanUrl || !menuUrl) {
            return {
                success: false,
                error: 'CSV URL belum di-set. Masukkan link CSV Google Sheets di halaman Settings.'
            };
        }

        console.log('[Sync] Starting with URLs:', { vendorUrl: !!vendorUrl, bahanUrl: !!bahanUrl, menuUrl: !!menuUrl, resepUrl: !!resepUrl });

        const fetchWithTimeout = async (url: string, timeoutMs = 20000): Promise<string> => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const res = await fetch(url, {
                    signal: controller.signal,
                    headers: { 'Cache-Control': 'no-cache' },
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText} → ${url}`);
                return await res.text();
            } finally {
                clearTimeout(timeoutId);
            }
        };

        const fetchAndParseCSV = async (url: string | undefined): Promise<string[][]> => {
            if (!url) return [];
            const text = await fetchWithTimeout(url);
            const result = Papa.parse<string[]>(text, { header: false, skipEmptyLines: true });
            if (result.errors.length > 0) {
                console.warn('[Sync] CSV parse warnings:', result.errors.slice(0, 3));
            }
            return result.data.slice(1); // skip header row
        };

        // 1. Fetch ALL CSVs in PARALLEL
        console.log('[Sync] Fetching CSVs...');
        const [vendorRows, bahanRows, menuRows, resepRows] = await Promise.all([
            fetchAndParseCSV(vendorUrl),
            fetchAndParseCSV(bahanUrl),
            fetchAndParseCSV(menuUrl),
            fetchAndParseCSV(resepUrl),
        ]);
        console.log('[Sync] Fetched rows:', { vendors: vendorRows.length, bahan: bahanRows.length, menu: menuRows.length, resep: resepRows.length });

        // 2. Clear existing tables in FK-safe order
        // Use sql`1=1` to ensure Drizzle/LibSQL actually executes the DELETE
        console.log('[Sync] Clearing existing data...');
        await db.delete(logPO).where(sql`1=1`);
        await db.delete(mappingResep).where(sql`1=1`);
        await db.delete(masterMenu).where(sql`1=1`);
        await db.delete(masterBahan).where(sql`1=1`);
        await db.delete(masterVendor).where(sql`1=1`);
        console.log('[Sync] Tables cleared.');

        // 3. Insert Vendors
        const vendorInserts = vendorRows
            .filter(row => row[0] && !row[0].startsWith('---') && row[0].trim() !== '')
            .map(row => ({
                id: String(row[0]).trim(),
                nama_vendor: String(row[1] || 'Unknown').trim(),
                kontak_wa: String(row[3] || '').replace(/[^0-9]/g, '') || null,
            }));

        if (vendorInserts.length > 0) {
            console.log('[Sync] Inserting', vendorInserts.length, 'vendors...');
            await db.insert(masterVendor).values(vendorInserts).onConflictDoNothing();
        }

        // 4. Insert Bahan
        const bahanMap = new Map<string, string>(); // name -> id
        const bahanInserts = bahanRows
            .filter(row => row[0] && !row[0].startsWith('---') && row[0].trim() !== '')
            .map(row => {
                const bahanId = String(row[0]).trim();
                const bahanNama = String(row[1] || '').trim();
                bahanMap.set(bahanNama, bahanId);
                const rawVendorId = row[6] ? String(row[6]).trim() : '';
                return {
                    id: bahanId,
                    nama_bahan: bahanNama,
                    satuan_dasar: String(row[2] || 'Pcs').trim(),
                    batas_minimum: parseFloat(String(row[3])) || 10,
                    vendor_id: (rawVendorId && rawVendorId !== '---' && rawVendorId !== '-') ? rawVendorId : null,
                    kategori_khusus: String(row[5] || '').trim(),
                };
            });

        if (bahanInserts.length > 0) {
            console.log('[Sync] Inserting', bahanInserts.length, 'bahan...');
            await db.insert(masterBahan).values(bahanInserts).onConflictDoNothing();
        }

        // 5. Insert Menu
        const menuMap = new Map<string, string>(); // name -> id
        const menuInserts = menuRows
            .filter(row => row[0] && !row[0].startsWith('---') && row[0].trim() !== '')
            .map(row => {
                const menuId = String(row[0]).trim();
                const menuNama = String(row[1] || '').trim();
                menuMap.set(menuNama, menuId);
                return {
                    id: menuId,
                    nama_menu: menuNama,
                    outlet_id: String(row[2] || 'O-001').trim(),
                };
            });

        if (menuInserts.length > 0) {
            console.log('[Sync] Inserting', menuInserts.length, 'menus...');
            await db.insert(masterMenu).values(menuInserts).onConflictDoNothing();
        }

        // 6. Insert Resep Mapping (only if both menu and bahan exist)
        const resepInserts: { id: string; menu_id: string; bahan_id: string; jumlah_pakai: number; station: string }[] = [];
        for (const row of resepRows) {
            if (!row[0] || String(row[0]).startsWith('---')) continue;
            const menuNama = String(row[0]).trim();
            const bahanNama = String(row[1]).trim();
            const menuId = menuMap.get(menuNama);
            const bahanId = bahanMap.get(bahanNama);
            if (menuId && bahanId) {
                resepInserts.push({
                    id: crypto.randomUUID(),
                    menu_id: menuId,
                    bahan_id: bahanId,
                    jumlah_pakai: parseFloat(String(row[2])) || 0,
                    station: String(row[4] || 'Bar').trim(),
                });
            } else {
                console.warn(`[Sync] No match for resep: "${menuNama}" → M:${!!menuId} | "${bahanNama}" → B:${!!bahanId}`);
            }
        }

        if (resepInserts.length > 0) {
            console.log('[Sync] Inserting', resepInserts.length, 'resep mappings...');
            await db.insert(mappingResep).values(resepInserts).onConflictDoNothing();
        }

        // 7. Seed INVENTORY_STATE for new bahan (don't overwrite existing stock!)
        const existingStates = await db.select({ id_bahan: inventoryState.id_bahan }).from(inventoryState);
        const existingBahanIds = new Set(existingStates.map(s => s.id_bahan));
        const newBahanForState = bahanInserts.filter(b => !existingBahanIds.has(b.id));

        if (newBahanForState.length > 0) {
            console.log('[Sync] Seeding', newBahanForState.length, 'new inventory states...');
            await db.insert(inventoryState).values(
                newBahanForState.map(b => ({
                    id: crypto.randomUUID(),
                    id_bahan: b.id,
                    current_stock: 0,
                    last_updated: new Date(),
                }))
            );
        }

        const summary = `Synced: ${vendorInserts.length} vendor, ${bahanInserts.length} bahan, ${menuInserts.length} menu, ${resepInserts.length} resep, ${newBahanForState.length} new inventory states.`;
        console.log('[Sync] Done:', summary);
        return { success: true, message: summary };

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('[Sync] FATAL ERROR:', msg, error);
        return { success: false, error: msg };
    }
}

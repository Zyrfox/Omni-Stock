'use server'

import { db } from '@/db'
import { masterVendor, masterBahan, masterMenu, mappingResep, inventoryState, logPO } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { google } from 'googleapis'

function getGoogleAuth() {
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
        throw new Error('Google Sheets credentials not configured. Set GOOGLE_SHEETS_CLIENT_EMAIL and GOOGLE_SHEETS_PRIVATE_KEY in .env');
    }

    return new google.auth.GoogleAuth({
        credentials: {
            client_email: clientEmail,
            private_key: privateKey,
        },
        scopes: [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/spreadsheets',
        ],
    });
}

async function fetchSheetData(sheetName: string): Promise<{ headers: string[], rows: string[][] }> {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    if (!spreadsheetId) {
        throw new Error('Missing GOOGLE_SHEETS_ID in environment variables');
    }

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:Z`,
    });

    const data = response.data.values || [];

    // Dynamic header detection: skip rows with 1 or fewer non-empty cells (like title blocks)
    let headerIdx = 0;
    while (headerIdx < data.length && data[headerIdx].filter(c => String(c).trim() !== '').length <= 1) {
        headerIdx++;
    }
    if (headerIdx >= data.length) headerIdx = 0;

    const headers = data.length > headerIdx ? data[headerIdx].map(h => String(h).trim()) : [];
    const rows = data.length > headerIdx + 1 ? data.slice(headerIdx + 1) as string[][] : [];

    return { headers, rows };
}

export async function syncMasterData() {
    try {
        console.log('[Sync] Starting Google Sheets v4 API sync...');

        // 1. Fetch ALL sheets in PARALLEL via Google Sheets API v4
        const [vendorData, bahanData, menuData, resepData] = await Promise.all([
            fetchSheetData('Master_Vendor'),
            fetchSheetData('Master_Bahan'),
            fetchSheetData('Master_Menu'),
            fetchSheetData('Master_Resep'),
        ]);

        const { rows: vendorRows, headers: vendorHeaders } = vendorData;
        const { rows: bahanRows, headers: bahanHeaders } = bahanData;
        const { rows: menuRows, headers: menuHeaders } = menuData;
        const { rows: resepRows, headers: resepHeaders } = resepData;

        console.log('[Sync] Fetched rows:', { vendors: vendorRows.length, bahan: bahanRows.length, menu: menuRows.length, resep: resepRows.length });

        // 2. Clear existing tables in FK-safe order
        console.log('[Sync] Clearing existing data...');
        await db.delete(logPO).where(sql`1=1`);
        await db.delete(mappingResep).where(sql`1=1`);
        await db.delete(masterMenu).where(sql`1=1`);
        await db.delete(masterBahan).where(sql`1=1`);
        await db.delete(masterVendor).where(sql`1=1`);
        console.log('[Sync] Tables cleared.');

        // 3. Insert Vendors
        const vIdIdx = Math.max(0, vendorHeaders.findIndex(h => h.toLowerCase().includes('id_vendor')));
        const vNamaIdx = Math.max(1, vendorHeaders.findIndex(h => h.toLowerCase().includes('nama_vendor')));
        const vWaIdx = vendorHeaders.findIndex(h => h.toLowerCase().includes('kontak_wa'));
        const vInfoIdx = vendorHeaders.findIndex(h => h.toLowerCase().includes('info_pembayaran'));

        const vendorInserts = vendorRows
            .filter(row => row[vIdIdx] && !String(row[vIdIdx]).startsWith('---') && String(row[vIdIdx]).trim() !== '')
            .map(row => ({
                id: String(row[vIdIdx]).trim(),
                nama_vendor: String(row[vNamaIdx] || 'Unknown').trim(),
                kontak_wa: vWaIdx !== -1 && row[vWaIdx] ? String(row[vWaIdx]).replace(/[^0-9]/g, '') || null : null,
                info_pembayaran: vInfoIdx !== -1 && row[vInfoIdx] ? String(row[vInfoIdx]) : null,
            }));

        if (vendorInserts.length > 0) {
            console.log('[Sync] Inserting', vendorInserts.length, 'vendors...');
            await db.insert(masterVendor).values(vendorInserts).onConflictDoNothing();
        }

        // 4. Insert Bahan
        const bahanMap = new Map<string, string>();
        const bIdIdx = Math.max(0, bahanHeaders.findIndex(h => h.toLowerCase().includes('id_bahan')));
        const bNamaIdx = Math.max(1, bahanHeaders.findIndex(h => h.toLowerCase().includes('nama_bahan')));
        const bSatuanIdx = Math.max(2, bahanHeaders.findIndex(h => h.toLowerCase().includes('satuan_dasar')));
        const bMinIdx = Math.max(3, bahanHeaders.findIndex(h => h.toLowerCase().includes('minimal')));

        const bHargaIdx = bahanHeaders.findIndex(h => h.toLowerCase() === 'harga_satuan');
        const bKemasanIdx = bahanHeaders.findIndex(h => h.toLowerCase() === 'kemasan_beli');
        const bIsiIdx = bahanHeaders.findIndex(h => h.toLowerCase() === 'isi_kemasan');
        const bVendorIdx = bahanHeaders.findIndex(h => h.toLowerCase().includes('vendor_id') || h.toLowerCase().includes('id_vendor'));
        const bKategoriIdx = bahanHeaders.findIndex(h => h.toLowerCase() === 'kategori_khusus');

        const bahanInserts = bahanRows
            .filter(row => row[bIdIdx] && !String(row[bIdIdx]).startsWith('---') && String(row[bIdIdx]).trim() !== '')
            .map(row => {
                const bahanId = String(row[bIdIdx]).trim();
                const bahanNama = String(row[bNamaIdx] || '').trim();
                bahanMap.set(bahanNama, bahanId);
                const rawVendorId = bVendorIdx !== -1 && row[bVendorIdx] ? String(row[bVendorIdx]).trim() : '';

                const kemasan_beli = bKemasanIdx !== -1 && row[bKemasanIdx] ? String(row[bKemasanIdx]).trim() : 'Pcs';
                const rawIsi = bIsiIdx !== -1 ? parseFloat(String(row[bIsiIdx])) : NaN;
                const isi_kemasan = !isNaN(rawIsi) && rawIsi > 0 ? rawIsi : 1;

                return {
                    id: bahanId,
                    nama_bahan: bahanNama,
                    satuan_dasar: String(row[bSatuanIdx] || 'Pcs').trim(),
                    batas_minimum: parseFloat(String(row[bMinIdx])) || 10,
                    harga_satuan: bHargaIdx !== -1 ? parseFloat(String(row[bHargaIdx]).replace(/[^0-9.-]+/g, "")) || 0 : 0,
                    kemasan_beli,
                    isi_kemasan,
                    vendor_id: (rawVendorId && rawVendorId !== '---' && rawVendorId !== '-') ? rawVendorId : null,
                    kategori_khusus: bKategoriIdx !== -1 && row[bKategoriIdx] ? String(row[bKategoriIdx]).trim() : null,
                };
            });

        if (bahanInserts.length > 0) {
            console.log('[Sync] Inserting', bahanInserts.length, 'bahan...');
            await db.insert(masterBahan).values(bahanInserts).onConflictDoNothing();
        }

        // 5. Insert Menu
        const menuMap = new Map<string, string>();
        const mIdIdx = Math.max(0, menuHeaders.findIndex(h => h.toLowerCase().includes('id_menu')));
        const mNamaIdx = Math.max(1, menuHeaders.findIndex(h => h.toLowerCase().includes('nama_menu')));
        const mOutletIdx = menuHeaders.findIndex(h => h.toLowerCase().includes('outlet'));

        const menuInserts = menuRows
            .filter(row => row[mIdIdx] && !String(row[mIdIdx]).startsWith('---') && String(row[mIdIdx]).trim() !== '')
            .map(row => {
                const menuId = String(row[mIdIdx]).trim();
                const menuNama = String(row[mNamaIdx] || '').trim();
                menuMap.set(menuNama, menuId);
                return {
                    id: menuId,
                    nama_menu: menuNama,
                    outlet_id: mOutletIdx !== -1 && row[mOutletIdx] ? String(row[mOutletIdx]).trim() : 'O-001',
                };
            });

        if (menuInserts.length > 0) {
            console.log('[Sync] Inserting', menuInserts.length, 'menus...');
            await db.insert(masterMenu).values(menuInserts).onConflictDoNothing();
        }

        // 6. Insert Resep Mapping
        const resepInserts: { id: string; menu_id: string; bahan_id: string; jumlah_pakai: number; station: string }[] = [];
        const rMenuIdx = Math.max(0, resepHeaders.findIndex(h => h.toLowerCase().includes('nama_menu')));
        const rBahanIdx = Math.max(1, resepHeaders.findIndex(h => h.toLowerCase().includes('nama_bahan')));
        const rQtyIdx = Math.max(2, resepHeaders.findIndex(h => h.toLowerCase().includes('qty')));
        const rStationIdx = Math.max(4, resepHeaders.findIndex(h => h.toLowerCase().includes('station')));

        const unmatchedResep: string[] = [];

        for (const row of resepRows) {
            if (!row[rMenuIdx] || String(row[rMenuIdx]).startsWith('---')) continue;
            const menuNama = String(row[rMenuIdx]).trim();
            const bahanNama = String(row[rBahanIdx]).trim();

            let menuId = menuMap.get(menuNama);
            if (!menuId) {
                const mTarget = menuNama.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
                let bestMatch = '';
                let maxMatch = 0;
                for (const k of menuMap.keys()) {
                    const kWords = k.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
                    const matchCount = mTarget.filter(w => kWords.includes(w)).length;
                    if (matchCount > maxMatch) { maxMatch = matchCount; bestMatch = k; }
                }
                if (maxMatch > 0) menuId = menuMap.get(bestMatch);
            }

            let bahanId = bahanMap.get(bahanNama);
            if (!bahanId) {
                const bTarget = bahanNama.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
                let bestMatch = '';
                let maxMatch = 0;
                for (const k of bahanMap.keys()) {
                    const kWords = k.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
                    const matchCount = bTarget.filter(w => kWords.includes(w)).length;
                    if (matchCount > maxMatch) { maxMatch = matchCount; bestMatch = k; }
                }
                if (maxMatch > 0) bahanId = bahanMap.get(bestMatch);
            }

            if (menuId && bahanId) {
                resepInserts.push({
                    id: crypto.randomUUID(),
                    menu_id: menuId,
                    bahan_id: bahanId,
                    jumlah_pakai: parseFloat(String(row[rQtyIdx])) || 0,
                    station: rStationIdx !== -1 && row[rStationIdx] ? String(row[rStationIdx]).trim() : 'Bar',
                });
            } else {
                unmatchedResep.push(`M(${!!menuId}): "${menuNama}" | B(${!!bahanId}): "${bahanNama}"`);
            }
        }

        if (resepInserts.length > 0) {
            console.log('[Sync] Inserting', resepInserts.length, 'resep mappings...');
            await db.insert(mappingResep).values(resepInserts).onConflictDoNothing();
        }

        // 7. Seed INVENTORY_STATE for new bahan
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

        const summary = `Synced: ${vendorInserts.length} vendor, ${bahanInserts.length} bahan, ${menuInserts.length} menu, ${resepInserts.length} resep, ${newBahanForState.length} states.`;
        console.log('[Sync] Done:', summary);
        return { success: true, message: summary };

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('[Sync] FATAL ERROR:', msg, error);
        return { success: false, error: msg };
    }
}

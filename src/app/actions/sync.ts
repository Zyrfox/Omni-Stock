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

async function fetchSheetData(sheetName: string): Promise<string[][]> {
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

    const rows = response.data.values || [];
    // Skip header row
    return rows.slice(1) as string[][];
}

export async function syncMasterData() {
    try {
        console.log('[Sync] Starting Google Sheets v4 API sync...');

        // 1. Fetch ALL sheets in PARALLEL via Google Sheets API v4
        const [vendorRows, bahanRows, menuRows, resepRows] = await Promise.all([
            fetchSheetData('Master_Vendor'),
            fetchSheetData('Master_Bahan'),
            fetchSheetData('Master_Menu'),
            fetchSheetData('Mapping_Resep'),
        ]);
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
        const bahanMap = new Map<string, string>();
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
        const menuMap = new Map<string, string>();
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

        // 6. Insert Resep Mapping
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

        const summary = `Synced: ${vendorInserts.length} vendor, ${bahanInserts.length} bahan, ${menuInserts.length} menu, ${resepInserts.length} resep, ${newBahanForState.length} new inventory states.`;
        console.log('[Sync] Done:', summary);
        return { success: true, message: summary };

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('[Sync] FATAL ERROR:', msg, error);
        return { success: false, error: msg };
    }
}

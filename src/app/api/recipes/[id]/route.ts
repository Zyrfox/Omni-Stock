export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { db } from "@/db";
import { masterMenu, mappingResep } from "@/db/schema";
import { eq } from "drizzle-orm";
import { google } from "googleapis";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idMenu } = await params;
        const payload = await req.json();
        const { menu, resep } = payload;

        if (!idMenu || idMenu !== menu.id) {
            return NextResponse.json({ error: "Menu ID in URL does not match payload" }, { status: 400 });
        }

        if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || !process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
            console.warn("[GSheets] Credentials not found.");
            return NextResponse.json({ error: "Google API keys missing in environment" }, { status: 500 });
        }

        // 1. DATABASE BATCH TRANSACTION (WIPE & REWRITE) - NEON HTTP SUPPORT
        const queries = [];

        // Upsert Master Menu (Updating details like category or outlet)
        queries.push(
            db.insert(masterMenu)
                .values({
                    id: idMenu,
                    nama_menu: menu.nama_menu,
                    outlet_id: menu.outlet_id,
                    kategori: menu.kategori,
                })
                .onConflictDoUpdate({
                    target: masterMenu.id,
                    set: {
                        nama_menu: menu.nama_menu,
                        outlet_id: menu.outlet_id,
                        kategori: menu.kategori,
                    }
                })
        );

        // Wipe existing Recipe / BOM lines for this Menu
        queries.push(db.delete(mappingResep).where(eq(mappingResep.menu_id, idMenu)));

        // Insert new composition explicitly applying User's string from "satuan"
        if (resep && resep.length > 0) {
            const inserts = resep.map((r: any) => ({
                id: crypto.randomUUID(),
                menu_id: idMenu,
                bahan_id: r.bahan_id,
                jumlah_pakai: r.jumlah_pakai || 0,
                satuan: r.satuan, // PRD V6.10: Form binding explicit unit
                station: "Bar",
            }));
            queries.push(db.insert(mappingResep).values(inserts));
        }

        // Execute as a single HTTP batch request for Atomicity
        await db.batch(queries as [any, ...any[]]);

        // 2. GOOGLE SHEETS NUCLEAR SYNC (Clear and Append All)
        try {
            const auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
                    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
                },
                scopes: [
                    'https://www.googleapis.com/auth/drive',
                    'https://www.googleapis.com/auth/drive.file',
                    'https://www.googleapis.com/auth/spreadsheets',
                ],
            });

            const sheets = google.sheets({ version: 'v4', auth });
            const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
            if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEETS_ID");

            // Wait a bit to ensure Neon HTTP transaction closes cleanly
            await new Promise(resolve => setTimeout(resolve, 500));

            // A. Fetch All Truth Data from DB
            const allMenus = await db.select().from(masterMenu);
            const allRecipes = await db.select().from(mappingResep);

            // B. Map 2D Arrays
            // Master_Menu Column Match: A: ID Menu, B: Nama Menu, C: Outlet, D: Kategori
            const menuValues = allMenus.map(m => [
                m.id,
                m.nama_menu,
                m.outlet_id,
                m.kategori
            ]);

            // Master_Resep Column Match: A: ID Mapping, B: ID Menu, C: ID Bahan, D: Jumlah, E: Satuan
            const recipeValues = allRecipes.map(r => [
                r.id,
                r.menu_id,
                r.bahan_id,
                r.jumlah_pakai,
                r.satuan
            ]);

            // C. Clear Sheets (Preserving Headers on Row 1)
            await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Master_Menu!A2:Z' });
            await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Master_Resep!A2:Z' });

            // D. Append 2D Arrays
            if (menuValues.length > 0) {
                await sheets.spreadsheets.values.append({
                    spreadsheetId,
                    range: 'Master_Menu!A2:Z',
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: menuValues }
                });
            }

            if (recipeValues.length > 0) {
                await sheets.spreadsheets.values.append({
                    spreadsheetId,
                    range: 'Master_Resep!A2:Z',
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: recipeValues }
                });
            }

            return NextResponse.json({ success: true, id_menu: idMenu });

        } catch (sheetError: unknown) {
            console.error("[GSheets API Error out-of-sync]:", sheetError);
            return NextResponse.json({
                success: true,
                warning: "DB Terupdate, tapi gagal sync ke Google Sheets. Cek koneksi API.",
                id_menu: idMenu
            });
        }
    } catch (error: unknown) {
        console.error("[Recipe API Error]:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { google } from "googleapis";
import path from "path";
import fs from "fs";

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { menu, resep } = payload;

        let keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;

        // Fallback to the user-provided path if it exists locally
        const fallbackPath = path.join(process.cwd(), "Credential", "media-project-backend-72ecb4975ad7.json");
        if (!keyFile && fs.existsSync(fallbackPath)) {
            keyFile = fallbackPath;
        }

        // Ensure service account details are available
        // We gracefully mock the logic if creds are not found anywhere
        if (!keyFile && !process.env.GOOGLE_SHEETS_CLIENT_EMAIL) {
            console.warn("[GSheets] Credentials not found. Mocking successful insert.");
            // Normally we would insert into SQLite immediately, 
            // but we mock that standard flow as per PRD "API akan menentukan tujuan row"
            return NextResponse.json({ success: true, mocked: true });
        }

        const auth = new google.auth.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            keyFile,
            credentials: (!keyFile && process.env.GOOGLE_SHEETS_PRIVATE_KEY) ? {
                client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
            } : undefined
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

        if (!spreadsheetId) {
            throw new Error("Missing GOOGLE_SHEETS_ID in environment variables");
        }

        // 1. Insert into Master_Menu
        // Columns assumed: ID, Nama Menu, Outlet (adjust as per actual sheet structure)
        const idMenu = `menu_${Date.now()}`;

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Master_Menu!A:C',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[idMenu, menu.nama_menu, menu.outlet_id]]
            }
        });

        // 2. Insert into Mapping_Resep
        // Columns assumed: ID Resep, Menu_ID, Bahan_ID, Qty, Satuan
        if (resep && resep.length > 0) {
            const resepValues = resep.map((r: any, i: number) => [
                `rsp_${idMenu}_${i}`,
                idMenu,
                r.bahan_id,
                r.jumlah_pakai,
                r.satuan
            ]);

            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Mapping_Resep!A:E',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: resepValues
                }
            });
        }

        return NextResponse.json({ success: true, id_menu: idMenu });
    } catch (error: any) {
        console.error("[GSheets API Error]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

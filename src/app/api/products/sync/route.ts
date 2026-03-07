export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { menu, resep } = payload;

        if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || !process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
            console.warn("[GSheets] Credentials not found. Mocking successful insert.");
            return NextResponse.json({ success: true, mocked: true });
        }

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

        if (!spreadsheetId) {
            throw new Error("Missing GOOGLE_SHEETS_ID in environment variables");
        }

        // Use the auto-generated ID from the modal, fallback to timestamp
        const idMenu = menu.id || `menu_${Date.now()}`;

        // 1. Insert into Master_Menu
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Master_Menu!A:D',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[idMenu, menu.nama_menu, menu.outlet_id, menu.kategori]]
            }
        });

        // 2. Insert into Master_Resep
        if (resep && resep.length > 0) {
            const resepValues = resep.map((r: { bahan_id: string, jumlah_pakai: number, satuan: string }, i: number) => [
                `rsp_${idMenu}_${i}`,
                idMenu,
                r.bahan_id,
                r.jumlah_pakai,
                r.satuan
            ]);

            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Master_Resep!A:E',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: resepValues
                }
            });
        }

        return NextResponse.json({ success: true, id_menu: idMenu });
    } catch (error: unknown) {
        console.error("[GSheets API Error]:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}

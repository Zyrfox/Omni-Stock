export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { db } from "@/db";
import { masterBahan } from "@/db/schema";
import { google } from "googleapis";

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { id, nama_bahan, satuan_dasar, batas_minimum, harga_satuan, kemasan_beli, isi_kemasan } = payload;

        if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || !process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
            console.warn("[GSheets] Credentials not found.");
            return NextResponse.json({ error: "Google API keys missing in environment" }, { status: 500 });
        }

        if (!nama_bahan) {
            return NextResponse.json({ error: "Nama Bahan is missing" }, { status: 400 });
        }

        // Generate ID if not provided (bhn_xxx_xxx)
        const finalId = id || `bhn_${nama_bahan.substring(0, 3).toLowerCase()}_${crypto.randomUUID().split('-')[0]}`;

        // 1. DATABASE UPSERT
        const ops = await db.insert(masterBahan)
            .values({
                id: finalId,
                nama_bahan,
                satuan_dasar,
                batas_minimum: batas_minimum || 0,
                harga_satuan: harga_satuan || 0,
                kemasan_beli: kemasan_beli || "Pack",
                isi_kemasan: isi_kemasan || 1,
            })
            .onConflictDoUpdate({
                target: masterBahan.id,
                set: {
                    nama_bahan,
                    satuan_dasar,
                    batas_minimum: batas_minimum || 0,
                    harga_satuan: harga_satuan || 0,
                    kemasan_beli: kemasan_beli || "Pack",
                    isi_kemasan: isi_kemasan || 1,
                }
            })
            .returning();


        // 2. GOOGLE SHEETS NUCLEAR SYNC (Clear entire Master_Bahan sheet, then Rewrite from DB)
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

            // A. Fetch all materials directly from DB for the absolute source of truth
            const allMaterials = await db.select().from(masterBahan);

            // Wait a bit to ensure Neon HTTP transaction closes cleanly (optional but safe)
            await new Promise(resolve => setTimeout(resolve, 500));

            // B. Prepare the 2D Array exact mapping for Master_Bahan
            // Map keys exactly matching the columns from Google Sheets (or assumed ordering)
            // Assuming A: ID, B: Nama, C: Satuan, D: Batas Min, E: Harga Satuan, F: Kemasan, G: Isi Kemasan
            const sheetValues = allMaterials.map(m => [
                m.id,
                m.nama_bahan,
                m.satuan_dasar,
                m.batas_minimum,
                m.harga_satuan,
                m.kemasan_beli,
                m.isi_kemasan
            ]);

            // C. Clear existing rows in Master_Bahan (A2:G to preserve headers if placed at row 1)
            // It's safer to clear everything except Header (Row 1)
            await sheets.spreadsheets.values.clear({
                spreadsheetId,
                range: 'Master_Bahan!A2:Z',
            });

            // D. Append the entire new 2D Array
            if (sheetValues.length > 0) {
                await sheets.spreadsheets.values.append({
                    spreadsheetId,
                    range: 'Master_Bahan!A2:Z',
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: sheetValues }
                });
            }

            return NextResponse.json({ success: true, item: ops[0] });

        } catch (sheetError: unknown) {
            console.error("[GSheets API Error out-of-sync]:", sheetError);
            // PRD Rule: If fail sync to GS, do not cancel DB transaction. Hand UI a warning
            return NextResponse.json({
                success: true,
                warning: "DB Terupdate, tapi gagal melakukan Nuclear Sync ke Google Sheets. Cek koneksi API.",
                item: ops[0]
            });
        }
    } catch (error: unknown) {
        console.error("[Material API Error]:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}

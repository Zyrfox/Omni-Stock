export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { matchKartuStok } from '@/lib/engine';
import * as xlsx from 'xlsx';
import { db } from '@/db';
import { uploadBatches, inventoryLogs } from '@/db/schema';
import { sql } from 'drizzle-orm';

// Parse angka format Indonesia (koma sebagai desimal)
function parseIndonesianNumber(val: string | number | undefined): number {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(',', '.');
    return parseFloat(cleaned) || 0;
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Pawoon "Kartu Stok" format:
        // Baris 0-6: Metadata (judul, outlet, tanggal, etc.)
        // Baris 7: Header
        // Baris 8+: Data aktual
        const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        const actualDataRows = rawData.slice(8);

        const outletRow = rawData[2] as string[];
        const outletName = outletRow ? String(outletRow[1] || 'Unknown') : 'Unknown';

        const parsedItems = actualDataRows
            .map((row: unknown) => {
                const r = row as string[];
                return {
                    nama_bahan: String(r[0] || '').trim(),
                    stok_awal: parseIndonesianNumber(r[2]),
                    stok_masuk: parseIndonesianNumber(r[3]),
                    stok_keluar: parseIndonesianNumber(r[4]),
                    penjualan: parseIndonesianNumber(r[5]),
                    stok_akhir: parseIndonesianNumber(r[8]),
                    satuan: String(r[9] || '').trim(),
                    kategori: String(r[1] || '').trim(),
                };
            })
            .filter(r => r.nama_bahan !== '' && r.nama_bahan !== 'Produk');

        if (parsedItems.length === 0) {
            return NextResponse.json({
                success: true,
                matchedItems: [],
                matchedCount: 0,
                unmatchedCount: 0,
                message: 'File berhasil dibaca, namun tidak ada item valid.'
            });
        }

        // Pure in-memory matching
        const result = await matchKartuStok(parsedItems, outletName);

        // PRD V6.1: The "Daily Snapshot" UPSERT logic
        if (result.matchedItems.length > 0) {
            const todayDate = new Date().toISOString().split('T')[0];
            const batchId = `batch_${todayDate}_${outletName.replace(/\s+/g, '_')}`;

            // UPSERT Upload Batch (Same day = update existing)
            const [batch] = await db.insert(uploadBatches).values({
                id: batchId,
                date: todayDate,
                outlet_id: outletName,
                status: 'processed',
                created_by: 'System' // Usually pulled from session auth if available
            }).onConflictDoUpdate({
                target: [uploadBatches.date, uploadBatches.outlet_id],
                set: {
                    status: 'processed',
                    created_at: new Date() // override with latest update time
                }
            }).returning();

            // UPSERT Inventory Logs linked to this Batch
            const logsToInsert = result.matchedItems.map(item => ({
                id: `log_${batch.id}_${item.id_bahan}`,
                batch_id: batch.id,
                id_bahan: item.id_bahan,
                current_stock: item.current_stock,
                min_stock: item.batas_minimum
            }));

            await db.insert(inventoryLogs).values(logsToInsert).onConflictDoUpdate({
                target: [inventoryLogs.batch_id, inventoryLogs.id_bahan],
                set: {
                    current_stock: sql`EXCLUDED.current_stock`,
                    min_stock: sql`EXCLUDED.min_stock`
                }
            });
            console.log(`[UPLOAD_API] Successfully UPSERTED snapshot for ${todayDate} - ${outletName}`);
        }

        return NextResponse.json({
            success: true,
            ...result,
            message: `Berhasil memproses ${result.matchedCount} item dari ${outletName}. ${result.unmatchedCount} item tidak ditemukan di Master Data.`
        });
    } catch (error: unknown) {
        console.error("[UPLOAD_API] Error:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Gagal memproses file' }, { status: 500 });
    }
}

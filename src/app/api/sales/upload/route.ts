export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { matchKartuStok } from '@/lib/engine';
import * as xlsx from 'xlsx';

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

        const outletRow = rawData[2] as any[];
        const outletName = outletRow ? String(outletRow[1] || 'Unknown') : 'Unknown';

        const parsedItems = actualDataRows
            .map((row: any) => ({
                nama_bahan: String(row[0] || '').trim(),
                stok_awal: parseIndonesianNumber(row[2]),
                stok_masuk: parseIndonesianNumber(row[3]),
                stok_keluar: parseIndonesianNumber(row[4]),
                penjualan: parseIndonesianNumber(row[5]),
                stok_akhir: parseIndonesianNumber(row[8]),
                satuan: String(row[9] || '').trim(),
                kategori: String(row[1] || '').trim(),
            }))
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

        // Pure in-memory matching — no DB writes
        const result = await matchKartuStok(parsedItems, outletName);

        return NextResponse.json({
            success: true,
            ...result,
            message: `Berhasil memproses ${result.matchedCount} item dari ${outletName}. ${result.unmatchedCount} item tidak ditemukan di Master Data.`
        });
    } catch (error: any) {
        console.error("[UPLOAD_API] Error:", error);
        return NextResponse.json({ error: error.message || 'Gagal memproses file' }, { status: 500 });
    }
}

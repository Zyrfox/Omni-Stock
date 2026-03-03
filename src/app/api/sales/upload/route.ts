import { NextResponse } from 'next/server';
import { processSalesData } from '@/lib/engine';
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
        // Baris 7: Header: Produk | Kategori | Stok Awal | Stok Masuk | Stok Keluar | Penjualan | Transfer | Penyesuaian | Stok Akhir | Satuan
        // Baris 8+: Data aktual
        const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        const actualDataRows = rawData.slice(8);

        const outletRow = rawData[2] as any[];
        const outletName = outletRow ? String(outletRow[1] || 'Unknown') : 'Unknown';

        // Kolom Kartu Stok Pawoon:
        // [0]=Produk, [1]=Kategori, [2]=Stok Awal, [3]=Stok Masuk, 
        // [4]=Stok Keluar, [5]=Penjualan, [6]=Transfer, [7]=Penyesuaian, 
        // [8]=Stok Akhir, [9]=Satuan
        const parsedItems = actualDataRows
            .map((row: any) => {
                const namaBahan = String(row[0] || '').trim();
                const stokAwal = parseIndonesianNumber(row[2]);
                const stokMasuk = parseIndonesianNumber(row[3]);
                const stokKeluar = parseIndonesianNumber(row[4]);
                const penjualan = parseIndonesianNumber(row[5]);
                const stokAkhir = parseIndonesianNumber(row[8]);
                const satuan = String(row[9] || '').trim();

                return {
                    nama_bahan: namaBahan,
                    stok_awal: stokAwal,
                    stok_masuk: stokMasuk,
                    stok_keluar: stokKeluar,
                    penjualan: penjualan,
                    stok_akhir: stokAkhir,       // Stok final hari ini dari Pawoon
                    satuan: satuan,
                    kategori: String(row[1] || '').trim(),
                };
            })
            .filter(r => r.nama_bahan !== '' && r.nama_bahan !== 'Produk');

        console.log(`[UPLOAD] File: ${file.name}`);
        console.log(`[UPLOAD] Outlet: ${outletName}`);
        console.log(`[UPLOAD] Total baris data: ${actualDataRows.length}, baris valid: ${parsedItems.length}`);

        if (parsedItems.length === 0) {
            return NextResponse.json({
                success: true,
                processed_rows: 0,
                message: 'File berhasil dibaca, namun tidak ada item valid.'
            });
        }

        const result = await processSalesData(parsedItems, `Upload: ${file.name}`);

        return NextResponse.json({
            success: true,
            ...result,
            outlet: outletName,
            message: `Berhasil memproses ${result.matchedCount} item dari ${outletName}. ${result.unmatchedCount} item tidak ditemukan di Master Data.`
        });
    } catch (error) {
        console.error("[UPLOAD_API] Error processing file:", error);
        return NextResponse.json({ error: 'Gagal memproses file' }, { status: 500 });
    }
}

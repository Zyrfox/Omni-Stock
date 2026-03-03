const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'New folder', 'Kartu Stok - (Back To Mie Kitchen) - Back To Mie Kitchen - 03 Maret 2026 - Pawoon  (2).xls');
const workbook = xlsx.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log('Total rows:', rawData.length);

// Header
console.log('\n=== HEADER (row 7) ===');
const header = rawData[7];
if (header) header.forEach((c, i) => console.log(`  [${i}]="${c}"`));

// Cari baris dengan Penjualan > 0
let found = 0;
for (let i = 8; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0) continue;
    const raw = row[5];
    let val = 0;
    if (typeof raw === 'number') val = raw;
    else if (typeof raw === 'string') val = parseFloat(raw.replace(',', '.'));
    if (val > 0) {
        found++;
        if (found <= 10) console.log(`Row ${i}: Produk="${row[0]}", Penjualan="${raw}" (type:${typeof raw}, parsed:${val})`);
    }
}
console.log(`\nTotal Penjualan > 0: ${found} dari ${rawData.length - 8} baris data`);

// Juga cek kolom lainnya
let stokKeluar = 0;
for (let i = 8; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0) continue;
    const raw = row[4];
    let val = 0;
    if (typeof raw === 'number') val = raw;
    else if (typeof raw === 'string') val = parseFloat(raw.replace(',', '.'));
    if (val > 0) { stokKeluar++; if (stokKeluar <= 3) console.log(`StokKeluar Row ${i}: "${row[0]}" = ${raw}`); }
}
console.log(`Stok Keluar > 0: ${stokKeluar}`);

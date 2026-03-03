// Diagnostik: cek apakah ada vendor_id di MASTER_BAHAN yang tidak ada di MASTER_VENDOR
const Database = require('better-sqlite3');
const db = new Database('sqlite.db', { readonly: true });

try {
    // Cek apakah FK enforcement aktif
    const fkStatus = db.prepare("PRAGMA foreign_keys").get();
    console.log("Foreign keys enforcement:", fkStatus);

    // Cari bahan yang punya vendor_id tidak cocok
    const orphanBahan = db.prepare(`
        SELECT b.id, b.nama_bahan, b.vendor_id 
        FROM MASTER_BAHAN b 
        WHERE b.vendor_id IS NOT NULL 
        AND b.vendor_id NOT IN (SELECT id FROM MASTER_VENDOR)
    `).all();
    console.log("Orphan Bahan (vendor_id tidak cocok):", orphanBahan.length, "items");
    if (orphanBahan.length > 0) {
        console.log("Contoh:", orphanBahan.slice(0, 5));
    }

    // Cek daftar vendor yang ada
    const vendors = db.prepare("SELECT id, nama_vendor FROM MASTER_VENDOR").all();
    console.log("Total vendors:", vendors.length);
    vendors.forEach(v => console.log(`  - ${v.id}: ${v.nama_vendor}`));

    // Cek jumlah bahan
    const bahanCount = db.prepare("SELECT COUNT(*) as count FROM MASTER_BAHAN").get();
    console.log("Total bahan:", bahanCount.count);

    // Cek bahan dengan vendor_id
    const bahanWithVendor = db.prepare("SELECT DISTINCT vendor_id FROM MASTER_BAHAN WHERE vendor_id IS NOT NULL").all();
    console.log("Unique vendor_ids di MASTER_BAHAN:", bahanWithVendor.map(b => b.vendor_id));

} catch (e) {
    console.error(e);
}
db.close();

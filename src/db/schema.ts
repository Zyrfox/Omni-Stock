import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const masterVendor = sqliteTable("MASTER_VENDOR", {
    id: text("id").primaryKey(),
    nama_vendor: text("nama_vendor").notNull(),
    kontak_wa: text("kontak_wa"),
    info_pembayaran: text("info_pembayaran"),
});

export const masterBahan = sqliteTable("MASTER_BAHAN", {
    id: text("id").primaryKey(),
    nama_bahan: text("nama_bahan").notNull(),
    satuan_dasar: text("satuan_dasar").notNull(),
    batas_minimum: real("batas_minimum").notNull(),
    harga_satuan: real("harga_satuan").default(0),
    vendor_id: text("vendor_id").references(() => masterVendor.id),
    kategori_khusus: text("kategori_khusus"), // To bypass Consignment
});

export const masterMenu = sqliteTable("MASTER_MENU", {
    id: text("id").primaryKey(),
    nama_menu: text("nama_menu").notNull(),
    outlet_id: text("outlet_id").notNull(),
});

export const mappingResep = sqliteTable("MAPPING_RESEP", {
    id: text("id").primaryKey(),
    menu_id: text("menu_id").references(() => masterMenu.id).notNull(),
    bahan_id: text("bahan_id").references(() => masterBahan.id).notNull(),
    jumlah_pakai: real("jumlah_pakai").notNull(),
    station: text("station"), // Kitchen or Bar
});

export const salesReports = sqliteTable("SALES_REPORTS", {
    id: text("id").primaryKey(),
    file_name: text("file_name").notNull(),
    upload_status: text("upload_status").notNull(), // 'parsed' or 'failed'
    outlet_id: text("outlet_id").notNull(),
    waktu_upload: integer("waktu_upload", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const salesReportDetails = sqliteTable("SALES_REPORT_DETAILS", {
    id: text("id").primaryKey(),
    report_id: text("report_id").references(() => salesReports.id).notNull(),
    nama_menu_raw: text("nama_menu_raw").notNull(),
    qty_terjual: integer("qty_terjual").notNull(),
    match_status: text("match_status").notNull(), // 'matched' / 'unmatched'
});

export const logPO = sqliteTable("LOG_PO", {
    id: text("id").primaryKey(),
    bahan_id: text("bahan_id").references(() => masterBahan.id).notNull(),
    vendor_id: text("vendor_id").references(() => masterVendor.id).notNull(),
    status: text("status").notNull(), // 'draft' / 'approved'
    tanggal_po: integer("tanggal_po", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const inventoryState = sqliteTable("INVENTORY_STATE", {
    id: text("id").primaryKey(),
    id_bahan: text("id_bahan").notNull(), // Links to GSheets Master Bahan ID
    current_stock: real("current_stock").notNull(),
    last_updated: integer("last_updated", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const salesHistory = sqliteTable("SALES_HISTORY", {
    id: text("id").primaryKey(),
    date: integer("date", { mode: 'timestamp' }).notNull(),
    id_menu: text("id_menu").notNull(), // Links to GSheets Master Menu ID
    qty_sold: integer("qty_sold").notNull(),
    revenue: real("revenue").notNull(),
    cogs: real("cogs").notNull(),
    gross_profit: real("gross_profit").notNull(),
    traffic_source: text("traffic_source"), // Added for dashboard logic
});

export const activityLog = sqliteTable("ACTIVITY_LOG", {
    id: text("id").primaryKey(),
    timestamp: integer("timestamp", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
    user: text("user").notNull(),
    action: text("action").notNull(),
});

export const stockMovement = sqliteTable("STOCK_MOVEMENT", {
    id: text("id").primaryKey(),
    date: integer("date", { mode: 'timestamp' }).notNull(),
    id_bahan: text("id_bahan").notNull(),
    stok_masuk: real("stok_masuk").notNull().default(0),
    stok_keluar: real("stok_keluar").notNull().default(0),
    stok_penyesuaian: real("stok_penyesuaian").notNull().default(0),
});

export const appSettings = sqliteTable("APP_SETTINGS", {
    key: text("key").primaryKey(),
    value: text("value").notNull(),
});

// PRD V4.0: Tracking physical uploads instead of random generic overwriting
export const uploadBatches = sqliteTable("UPLOAD_BATCHES", {
    id: text("id").primaryKey(), // Using timestamp logic or UIID
    created_at: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
    outlet_id: text("outlet_id").notNull(),
    status: text("status").notNull(), // e.g. 'processed'
});

export const inventoryLogs = sqliteTable("INVENTORY_LOGS", {
    id: text("id").primaryKey(),
    batch_id: text("batch_id").references(() => uploadBatches.id).notNull(),
    id_bahan: text("id_bahan").notNull(),
    current_stock: real("current_stock").notNull(),
    min_stock: real("min_stock").notNull(), // Snapshot
});

export const uploadBatchDetails = sqliteTable("UPLOAD_BATCH_DETAILS", {
    id: text("id").primaryKey(),
    batch_id: text("batch_id").references(() => uploadBatches.id).notNull(),
    nama_bahan_raw: text("nama_bahan_raw").notNull(),
    is_matched: integer("is_matched", { mode: 'boolean' }).notNull(),
});

export const invoices = sqliteTable("INVOICES", {
    id: text("id").primaryKey(), // Using random UUID
    vendor_nama: text("vendor_nama").notNull(),
    total_items: integer("total_items").notNull(),
    total_biaya: real("total_biaya").notNull(),
    status: text("status").notNull().default("UNPAID"), // PAID / UNPAID
    created_at: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const invoiceItems = sqliteTable("INVOICE_ITEMS", {
    id: text("id").primaryKey(),
    invoice_id: text("invoice_id").references(() => invoices.id).notNull(),
    bahan_id: text("bahan_id").notNull(),
    nama_bahan: text("nama_bahan").notNull(),
    qty: real("qty").notNull(),
    harga_satuan: real("harga_satuan").notNull(),
});

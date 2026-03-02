import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const masterVendor = sqliteTable("MASTER_VENDOR", {
    id: text("id").primaryKey(),
    nama_vendor: text("nama_vendor").notNull(),
    kontak_wa: text("kontak_wa"),
});

export const masterBahan = sqliteTable("MASTER_BAHAN", {
    id: text("id").primaryKey(),
    nama_bahan: text("nama_bahan").notNull(),
    satuan_dasar: text("satuan_dasar").notNull(),
    batas_minimum: real("batas_minimum").notNull(),
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

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const sqlite = new Database('sqlite.db');

// Auto-create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS MASTER_VENDOR (id TEXT PRIMARY KEY, nama_vendor TEXT NOT NULL, kontak_wa TEXT);
  CREATE TABLE IF NOT EXISTS MASTER_BAHAN (id TEXT PRIMARY KEY, nama_bahan TEXT NOT NULL, satuan_dasar TEXT NOT NULL, batas_minimum REAL NOT NULL, vendor_id TEXT REFERENCES MASTER_VENDOR(id), kategori_khusus TEXT);
  CREATE TABLE IF NOT EXISTS MASTER_MENU (id TEXT PRIMARY KEY, nama_menu TEXT NOT NULL, outlet_id TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS MAPPING_RESEP (id TEXT PRIMARY KEY, menu_id TEXT NOT NULL REFERENCES MASTER_MENU(id), bahan_id TEXT NOT NULL REFERENCES MASTER_BAHAN(id), jumlah_pakai REAL NOT NULL, station TEXT);
  CREATE TABLE IF NOT EXISTS SALES_REPORTS (id TEXT PRIMARY KEY, file_name TEXT NOT NULL, upload_status TEXT NOT NULL, outlet_id TEXT NOT NULL, waktu_upload INTEGER DEFAULT (strftime('%s', 'now')));
  CREATE TABLE IF NOT EXISTS SALES_REPORT_DETAILS (id TEXT PRIMARY KEY, report_id TEXT NOT NULL REFERENCES SALES_REPORTS(id), nama_menu_raw TEXT NOT NULL, qty_terjual INTEGER NOT NULL, match_status TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS LOG_PO (id TEXT PRIMARY KEY, bahan_id TEXT NOT NULL REFERENCES MASTER_BAHAN(id), vendor_id TEXT NOT NULL REFERENCES MASTER_VENDOR(id), status TEXT NOT NULL, tanggal_po INTEGER DEFAULT (strftime('%s', 'now')));
  CREATE TABLE IF NOT EXISTS INVENTORY_STATE (id TEXT PRIMARY KEY, id_bahan TEXT NOT NULL, current_stock REAL NOT NULL, last_updated INTEGER NOT NULL DEFAULT (strftime('%s', 'now')));
  CREATE TABLE IF NOT EXISTS SALES_HISTORY (id TEXT PRIMARY KEY, date INTEGER NOT NULL, id_menu TEXT NOT NULL, qty_sold INTEGER NOT NULL, revenue REAL NOT NULL, cogs REAL NOT NULL, gross_profit REAL NOT NULL, traffic_source TEXT);
  CREATE TABLE IF NOT EXISTS ACTIVITY_LOG (id TEXT PRIMARY KEY, timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now')), user TEXT NOT NULL, action TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS APP_SETTINGS (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`);

export const db = drizzle(sqlite, { schema });

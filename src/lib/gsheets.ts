import { parse } from "csv-parse/sync";

// In-memory cache
let masterDataCache: {
    bahan: any[];
    menu: any[];
    resep: any[];
    lastFetch: number;
} | null = null;

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 Hour

// Replace these URLs with the actual Public CSV links from Google Sheets
const URL_MASTER_BAHAN = process.env.CSV_URL_BAHAN || "";
const URL_MASTER_MENU = process.env.CSV_URL_MENU || "";
const URL_MAPPING_RESEP = process.env.CSV_URL_RESEP || "";

async function fetchCSV(url: string) {
    if (!url) return [];
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const csvContent = await response.text();
        const records = parse(csvContent, { columns: true, skip_empty_lines: true });
        return records;
    } catch (error) {
        console.error(`Error fetching CSV from ${url}:`, error);
        return [];
    }
}

export async function fetchMasterData(forceRefresh = false) {
    const now = Date.now();

    if (!forceRefresh && masterDataCache && (now - masterDataCache.lastFetch < CACHE_TTL_MS)) {
        console.log("[CACHE] Returning Master Data from memory");
        return masterDataCache;
    }

    console.log("[FETCH] Fetching fresh Master Data from Google Sheets...");

    const [bahan, menu, resep] = await Promise.all([
        fetchCSV(URL_MASTER_BAHAN),
        fetchCSV(URL_MASTER_MENU),
        fetchCSV(URL_MAPPING_RESEP)
    ]);

    masterDataCache = {
        bahan,
        menu,
        resep,
        lastFetch: now
    };

    return masterDataCache;
}

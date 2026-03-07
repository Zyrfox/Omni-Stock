import { parse } from "csv-parse/sync";

// In-memory cache
let masterDataCache: {
    bahan: Record<string, unknown>[];
    menu: Record<string, unknown>[];
    resep: Record<string, unknown>[];
    lastFetch: number;
} | null = null;

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 Hour

// Replace these URLs with the actual Public CSV links from Google Sheets
const FALLBACK_BAHAN = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT_AF9i3elblALkCmcQhMNe-3_Ga77FTtON7yHtRVo2qhuDvEXK0HXwb6U0aHxYJY9_o9uAsYRhuGHe/pub?gid=1930484537&single=true&output=csv";
const FALLBACK_MENU = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT_AF9i3elblALkCmcQhMNe-3_Ga77FTtON7yHtRVo2qhuDvEXK0HXwb6U0aHxYJY9_o9uAsYRhuGHe/pub?gid=0&single=true&output=csv";
const FALLBACK_RESEP = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT_AF9i3elblALkCmcQhMNe-3_Ga77FTtON7yHtRVo2qhuDvEXK0HXwb6U0aHxYJY9_o9uAsYRhuGHe/pub?gid=1358887311&single=true&output=csv";

const URL_MASTER_BAHAN = process.env.CSV_URL_BAHAN || FALLBACK_BAHAN;
const URL_MASTER_MENU = process.env.CSV_URL_MENU || FALLBACK_MENU;
const URL_MAPPING_RESEP = process.env.CSV_URL_RESEP || FALLBACK_RESEP;

async function fetchCSV(url: string) {
    if (!url) return [];
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const csvContent = await response.text();
        // Check if response is HTML (indicates error page)
        if (csvContent.trim().startsWith('<')) {
            console.error(`[CSV] Expected CSV but got HTML from ${url.substring(0, 80)}...`);
            return [];
        }
        const records = parse(csvContent, { columns: true, skip_empty_lines: true });
        // Filter out separator rows (Google Sheets exports a "---" row after headers)
        return records.filter((r) => {
            const vals = Object.values(r as Record<string, unknown>) as string[];
            return !vals.every(v => String(v).trim() === '---' || String(v).trim() === '');
        });
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
        bahan: bahan as Record<string, unknown>[],
        menu: menu as Record<string, unknown>[],
        resep: resep as Record<string, unknown>[],
        lastFetch: now
    };

    return masterDataCache;
}

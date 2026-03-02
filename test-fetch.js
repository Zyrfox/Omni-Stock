const fetch = require('node-fetch'); // Next.js node fetch or global fetch
const Papa = require('papaparse');
require('dotenv').config();

async function testFetch() {
    console.log("CSV_URL_VENDOR:", process.env.CSV_URL_VENDOR);
    const urls = [
        process.env.CSV_URL_VENDOR,
        process.env.CSV_URL_BAHAN,
        process.env.CSV_URL_MENU,
        process.env.CSV_URL_RESEP
    ];
    for (const url of urls) {
        if (!url) {
            console.log("Undefined URL");
            continue;
        }
        console.log("Fetching:", url.substring(0, 100) + "...");
        try {
            const res = await globalThis.fetch(url); // native fetch
            console.log("Status:", res.status);
            if (!res.ok) { console.log("Failed"); continue; }
            const text = await res.text();
            console.log("Response text start:", text.substring(0, 80));
            const result = Papa.parse(text, { header: false, skipEmptyLines: true });
            console.log("Parsed rows:", result.data.length);
        } catch (e) {
            console.log("Fetch Error", e);
        }
    }
}
testFetch().catch(console.error);

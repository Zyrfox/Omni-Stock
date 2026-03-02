const fs = require('fs');
const dotenv = require('dotenv');
const Papa = require('papaparse');
const envConfig = dotenv.parse(fs.readFileSync('.env'));
for (const k in envConfig) { process.env[k] = envConfig[k]; }

async function testFetch() {
    const urls = {
        Vendor: process.env.CSV_URL_VENDOR,
        Bahan: process.env.CSV_URL_BAHAN,
        Menu: process.env.CSV_URL_MENU,
        Resep: process.env.CSV_URL_RESEP
    };
    for (const [name, url] of Object.entries(urls)) {
        if (!url) continue;
        const res = await globalThis.fetch(url);
        const text = await res.text();
        const result = Papa.parse(text, { header: false, skipEmptyLines: true });
        console.log(`\n=== ${name} ===`);
        console.log("Row 0 (Header):", JSON.stringify(result.data[0]));
        console.log("Row 1:", JSON.stringify(result.data[1]));
        console.log("Row 2:", JSON.stringify(result.data[2]));
    }
}
testFetch().catch(console.error);

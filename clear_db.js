const { db } = require('./src/db/index');
const { uploadBatches, inventoryLogs, uploadBatchDetails } = require('./src/db/schema');

async function clearData() {
    console.log("Clearing inventoryLogs...");
    await db.delete(inventoryLogs);
    console.log("Clearing uploadBatchDetails...");
    await db.delete(uploadBatchDetails);
    console.log("Clearing uploadBatches...");
    await db.delete(uploadBatches);
    console.log("Done.");
    process.exit(0);
}

clearData().catch(e => { console.error(e); process.exit(1); });

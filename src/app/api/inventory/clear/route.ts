import { NextResponse } from "next/server";
import { db } from "@/db";
import { inventoryState, uploadBatches, uploadBatchDetails, inventoryLogs } from "@/db/schema";

export async function DELETE() {
    try {
        // Hapus semua data dari inventory_state
        await db.delete(inventoryState);

        // Hapus history upload dari tabel dependen terlebih dahulu (Foreign Key)
        await db.delete(inventoryLogs);
        await db.delete(uploadBatchDetails);

        // Terakhir hapus parent table uploadBatches
        await db.delete(uploadBatches);

        return NextResponse.json({ success: true, message: "Inventory data cleared successfully" });
    } catch (error: any) {
        console.error("Error clearing inventory:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

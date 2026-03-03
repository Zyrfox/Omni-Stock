import { NextResponse } from 'next/server';
import { fetchMasterData } from '@/lib/gsheets';
import { db } from '@/db';
import { activityLog, inventoryState } from '@/db/schema';

export async function POST() {
    try {
        // Force refresh bypassing the cache
        const masterData = await fetchMasterData(true);

        if (masterData && masterData.bahan && masterData.bahan.length > 0) {
            // Seed missing inventory state records for new master bahan items
            const existingTracking = await db.select().from(inventoryState);
            const existingIds = new Set(existingTracking.map(s => s.id_bahan));

            const newItems = masterData.bahan.filter(b => !existingIds.has(b.id_bahan));

            if (newItems.length > 0) {
                const inserts = newItems.map(b => ({
                    id: crypto.randomUUID(),
                    id_bahan: b.id_bahan,
                    current_stock: 0, // Default to 0, requires physical count or Restock PO to increase
                }));
                await db.insert(inventoryState).values(inserts);
            }
        }

        await db.insert(activityLog).values({
            id: crypto.randomUUID(),
            user: "Admin",
            action: "Forced Sync with Master GSheets",
        });

        return NextResponse.json({ success: true, message: "Master Data Synced successfully" });
    } catch (error) {
        console.error("[SYNC_API] Error:", error);
        return NextResponse.json({ error: 'Failed to sync' }, { status: 500 });
    }
}

import { db } from "@/db";
import { salesReports } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Info } from "lucide-react";

export async function LastSyncedBadge() {
    const lastSyncs = await db.select()
        .from(salesReports)
        .orderBy(desc(salesReports.waktu_upload))
        .limit(1);

    const lastSync = lastSyncs[0];

    if (!lastSync) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm border border-blue-100 dark:border-blue-800/50">
            <Info className="h-4 w-4 shrink-0" />
            <span className="truncate">
                Last Synced: <span className="font-semibold">{lastSync.file_name}</span> | {lastSync.waktu_upload ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(lastSync.waktu_upload) : 'N/A'}
            </span>
        </div>
    );
}

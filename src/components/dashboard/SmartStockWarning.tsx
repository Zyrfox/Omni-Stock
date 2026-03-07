import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/db"
import { uploadBatches, inventoryLogs, masterBahan } from "@/db/schema"
import { desc, eq, and, gte } from "drizzle-orm"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export async function SmartStockWarning() {
    // Smart Stock reads only latest update batch and finds items currently AT or BELOW min_stock
    // PRD 6.14: Enforce Dirty Data Clearance (archived = false) & 72-Hour TTL
    const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const latestBatch = await db.select()
        .from(uploadBatches)
        .where(
            and(
                eq(uploadBatches.archived, false),
                gte(uploadBatches.created_at, threeDaysAgo)
            )
        )
        .orderBy(desc(uploadBatches.created_at))
        .limit(1);

    type WarningItem = { nama: string, stock: number, min: number, unit: string };
    const warnings: WarningItem[] = [];

    if (latestBatch.length > 0) {
        const logs = await db.select().from(inventoryLogs).where(eq(inventoryLogs.batch_id, latestBatch[0].id));
        const bahanMap = await db.select().from(masterBahan);

        for (const log of logs) {
            if (log.current_stock <= log.min_stock) {
                const bInfo = bahanMap.find(b => b.id === log.id_bahan);
                if (bInfo) {
                    warnings.push({
                        nama: bInfo.nama_bahan,
                        stock: log.current_stock,
                        min: log.min_stock,
                        unit: bInfo.satuan_dasar
                    });
                }
            }
        }
    }

    // Sort by most deficient
    warnings.sort((a, b) => (a.stock - a.min) - (b.stock - b.min));
    const topWarnings = warnings.slice(0, 5);

    return (
        <Card className="h-full border-amber-500/20 shadow-lg relative overflow-hidden bg-gradient-to-r from-amber-500/5 to-transparent">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" /> Smart Stock Warning
                </CardTitle>
                <CardDescription>Barang fast-moving menipis</CardDescription>
            </CardHeader>
            <CardContent>
                {topWarnings.length > 0 ? (
                    <div className="space-y-3 mt-2">
                        {topWarnings.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-background/60 border border-amber-500/10">
                                <span className="text-sm font-medium w-3/5 truncate" title={item.nama}>{item.nama}</span>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className={item.stock <= 0 ? "text-red-600 font-bold" : "text-amber-600 font-semibold"}>
                                        {item.stock} {item.unit}
                                    </span>
                                    <span className="text-muted-foreground w-12 text-right text-[10px]">(Min: {item.min})</span>
                                </div>
                            </div>
                        ))}
                        {warnings.length > 5 && (
                            <div className="pt-2 border-t border-amber-500/10 text-center">
                                <Link href="/dashboard/stock-warnings" className="text-xs font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 hover:underline">
                                    Lihat Semua ({warnings.length})
                                </Link>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-32 px-4 text-center">
                        <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                            <span className="text-xl">👍</span>
                        </div>
                        <p className="text-sm font-medium">Stok Aman</p>
                        <p className="text-xs text-muted-foreground mt-1">Tidak ada peringatan stock menipis di update terakhir.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

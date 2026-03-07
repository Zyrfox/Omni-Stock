import { db } from "@/db"
import { uploadBatches, inventoryLogs, masterBahan } from "@/db/schema"
import { desc, eq, and, gte } from "drizzle-orm"
import { AlertCircle, Package, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default async function StockWarningsPage() {
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

    type WarningItem = { nama: string, stock: number, min: number, unit: string, vendor: string };
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
                        unit: bInfo.satuan_dasar,
                        vendor: bInfo.vendor_id || "Unknown" // Note: Normally resolved to vendor name
                    });
                }
            }
        }
    }

    warnings.sort((a, b) => (a.stock - a.min) - (b.stock - b.min));

    return (
        <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-8">
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="outline" size="icon" className="h-9 w-9">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
                        <AlertCircle className="h-6 w-6 text-amber-500" />
                        Status Inventori
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">Daftar lengkap bahan baku menipis dan habis.</p>
                </div>
            </div>

            <Card className="border-amber-500/20 shadow-lg relative overflow-hidden bg-gradient-to-r from-amber-500/5 to-transparent">
                <CardHeader className="pb-4 border-b border-border/50">
                    <CardTitle className="text-lg flex justify-between items-center">
                        Daftar Peringatan Stok
                        <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-600">{warnings.length} Item Menipis</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {warnings.length > 0 ? (
                        <div className="divide-y divide-border/50">
                            {warnings.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-4 hover:bg-secondary/20 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${item.stock <= 0 ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-500'}`}>
                                            {item.stock <= 0 ? <AlertCircle className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <p className="font-medium">{item.nama}</p>
                                            <p className="text-xs text-muted-foreground">Vendor ID: {item.vendor}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-lg ${item.stock <= 0 ? "text-destructive" : "text-amber-500"}`}>
                                            {item.stock} <span className="text-sm font-normal text-muted-foreground">{item.unit}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">Minimal: {item.min}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                <span className="text-3xl">👍</span>
                            </div>
                            <h3 className="text-lg font-semibold">Semua Stok Aman</h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                Tidak ada peringatan batas minimum. Inventory dalam keadaan sehat.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

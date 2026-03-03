import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { db } from "@/db"
import { salesReports, salesReportDetails, inventoryState, masterBahan, logPO, activityLog } from "@/db/schema"
import { desc, eq, sql } from "drizzle-orm"
import { BarChart3, TrendingUp, TrendingDown, FileText, ClipboardCheck, Activity } from "lucide-react"

export default async function ReportPage() {
    // Gather all stats
    const reports = await db.select().from(salesReports);
    const allDetails = await db.select().from(salesReportDetails);
    const allStock = await db.select().from(inventoryState);
    const allBahan = await db.select().from(masterBahan);
    const allPO = await db.select().from(logPO);
    const recentLogs = await db.select().from(activityLog).orderBy(desc(activityLog.timestamp)).limit(20);

    const matchedItems = allDetails.filter(d => d.match_status === 'matched').length;
    const unmatchedItems = allDetails.filter(d => d.match_status === 'unmatched').length;
    const matchRate = allDetails.length > 0 ? ((matchedItems / allDetails.length) * 100).toFixed(1) : '0';

    const draftPO = allPO.filter(p => p.status === 'draft').length;
    const approvedPO = allPO.filter(p => p.status === 'approved').length;

    // Stock health
    const lowStock = allStock.filter(s => {
        const bahan = allBahan.find(b => b.id === s.id_bahan);
        return bahan && s.current_stock <= bahan.batas_minimum;
    }).length;
    const healthyStock = allStock.length - lowStock;

    // Top consumed items (by lowest stock relative to minimum)
    const stockHealth = allStock
        .map(s => {
            const bahan = allBahan.find(b => b.id === s.id_bahan);
            if (!bahan) return null;
            const ratio = bahan.batas_minimum > 0 ? s.current_stock / bahan.batas_minimum : 999;
            return {
                nama: bahan.nama_bahan,
                stok: s.current_stock,
                minimum: bahan.batas_minimum,
                satuan: bahan.satuan_dasar,
                ratio,
            };
        })
        .filter(Boolean)
        .sort((a, b) => a!.ratio - b!.ratio)
        .slice(0, 10) as { nama: string; stok: number; minimum: number; satuan: string; ratio: number }[];

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Report & Analytics</h2>
                <p className="text-slate-500 dark:text-slate-400">Ringkasan operasional: upload, stok, dan Purchase Order.</p>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 dark:bg-blue-500/20 p-2.5 rounded-xl">
                                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{reports.length}</p>
                                <p className="text-xs text-slate-500">Files Uploaded</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2.5 rounded-xl">
                                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{matchRate}%</p>
                                <p className="text-xs text-slate-500">Match Rate</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-100 dark:bg-amber-500/20 p-2.5 rounded-xl">
                                <ClipboardCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{draftPO} / {approvedPO}</p>
                                <p className="text-xs text-slate-500">Draft / Approved PO</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className={`${lowStock > 0 ? 'bg-red-100 dark:bg-red-500/20' : 'bg-emerald-100 dark:bg-emerald-500/20'} p-2.5 rounded-xl`}>
                                <TrendingDown className={`h-5 w-5 ${lowStock > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{lowStock}</p>
                                <p className="text-xs text-slate-500">Low Stock Items</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Critical Stock Items */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Stok Paling Kritis
                        </CardTitle>
                        <CardDescription>10 bahan baku dengan rasio stok terhadap minimum terendah.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stockHealth.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Bahan</TableHead>
                                        <TableHead className="text-right">Stok</TableHead>
                                        <TableHead className="text-right">Min</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stockHealth.map((item, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">{item.nama}</TableCell>
                                            <TableCell className="text-right">{item.stok.toFixed(1)} {item.satuan}</TableCell>
                                            <TableCell className="text-right text-slate-500">{item.minimum}</TableCell>
                                            <TableCell className="text-center">
                                                {item.ratio <= 0 ? (
                                                    <Badge variant="destructive">Habis</Badge>
                                                ) : item.ratio <= 1 ? (
                                                    <Badge className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-0">Low</Badge>
                                                ) : item.ratio <= 1.5 ? (
                                                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-0">Warning</Badge>
                                                ) : (
                                                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-0">OK</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-sm text-slate-500 flex h-24 items-center justify-center border rounded-md border-dashed">
                                Belum ada data inventori.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Activity Log
                        </CardTitle>
                        <CardDescription>20 aktivitas terakhir yang tercatat oleh sistem.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentLogs.length > 0 ? (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {recentLogs.map((log) => (
                                    <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                        <div className="bg-primary/10 p-1.5 rounded-full mt-0.5">
                                            <Activity className="h-3 w-3 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm leading-snug">{log.action}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-slate-500">{log.user}</span>
                                                <span className="text-xs text-slate-400">
                                                    {log.timestamp ? new Date(Number(log.timestamp) * 1000).toLocaleString('id-ID', {
                                                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                    }) : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-slate-500 flex h-24 items-center justify-center border rounded-md border-dashed">
                                Belum ada aktivitas tercatat.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

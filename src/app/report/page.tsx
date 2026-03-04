import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { db } from "@/db"
import { uploadBatches, uploadBatchDetails, invoices, activityLog } from "@/db/schema"
import { desc, eq, and, gte, lt, sql } from "drizzle-orm"
import { BarChart3, TrendingUp, TrendingDown, FileText, ClipboardCheck, Activity } from "lucide-react"
import { MonthYearPicker } from "@/components/report/MonthYearPicker"

export default async function ReportPage(props: { searchParams: Promise<{ month?: string, year?: string }> }) {
    const searchParams = await props.searchParams;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const targetMonth = parseInt(searchParams.month || currentMonth.toString());
    const targetYear = parseInt(searchParams.year || currentYear.toString());

    // Calculate start and end UNIX timestamps for the selected month to mimic filtering
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 1);
    const startTs = startDate.getTime(); // Wait, created_at might be Date mode in some places, but SQLite uses ISO or numeric. 
    // In our schema, uploadBatches/invoices use { mode: 'timestamp' } which returns Date objects. 
    // So we can filter via JS or use SQL Date functions. Let's filter via JS after fetching since data volume is manageable for MVP, or use SQL if possible.
    // For safety, let's fetch and filter since SQLite dates can be tricky with modes.

    const allBatches = await db.select().from(uploadBatches).orderBy(desc(uploadBatches.created_at));
    const allDetails = await db.select().from(uploadBatchDetails);
    const allInvoices = await db.select().from(invoices).orderBy(desc(invoices.created_at));
    const allLogs = await db.select().from(activityLog).orderBy(desc(activityLog.timestamp));

    // FILTER by Selected Month & Year
    const filteredBatches = allBatches.filter(b => {
        if (!b.created_at) return false;
        const d = new Date(b.created_at);
        return d.getMonth() + 1 === targetMonth && d.getFullYear() === targetYear;
    });

    const filteredInvoices = allInvoices.filter(i => {
        if (!i.created_at) return false;
        const d = new Date(i.created_at);
        return d.getMonth() + 1 === targetMonth && d.getFullYear() === targetYear;
    });

    const recentLogs = allLogs.filter(l => {
        if (!l.timestamp) return false;
        let d: Date;
        if (typeof l.timestamp === 'number') d = new Date(l.timestamp * 1000);
        else d = new Date(l.timestamp);
        return d.getMonth() + 1 === targetMonth && d.getFullYear() === targetYear;
    }).slice(0, 50);

    const filteredBatchIds = new Set(filteredBatches.map(b => b.id));
    const filteredDetails = allDetails.filter(d => filteredBatchIds.has(d.batch_id));

    const matchedItems = filteredDetails.filter(d => d.is_matched).length;
    const matchRate = filteredDetails.length > 0 ? ((matchedItems / filteredDetails.length) * 100).toFixed(1) : '0';

    const totalInvoiceCost = filteredInvoices.reduce((sum, inv) => sum + inv.total_biaya, 0);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Report & Analytics</h2>
                    <p className="text-slate-500 dark:text-slate-400">Arsip riwayat operasional, upload stok, dan histori pengeluaran PO.</p>
                </div>
                <MonthYearPicker />
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 dark:bg-blue-500/20 p-2.5 rounded-xl">
                                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{filteredBatches.length}</p>
                                <p className="text-xs text-slate-500">Stok Uploads</p>
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
                                <p className="text-xs text-slate-500">Avg. Match Rate</p>
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
                                <p className="text-2xl font-bold">{filteredInvoices.length}</p>
                                <p className="text-xs text-slate-500">Invoice Approved</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className={'bg-red-100 dark:bg-red-500/20 p-2.5 rounded-xl'}>
                                <TrendingDown className={'h-5 w-5 text-red-600 dark:text-red-400'} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    <span className="text-sm">Rp</span> {(totalInvoiceCost / 1000000).toFixed(1)}<span className="text-sm">M</span>
                                </p>
                                <p className="text-xs text-slate-500">Total Pengeluaran PO</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Activity Log ({startDate.toLocaleString('id-ID', { month: 'short', year: 'numeric' })})
                        </CardTitle>
                        <CardDescription>Rekam jejak seluruh aktivitas sinkronisasi dan manajemen arsip di bulan terpilih.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentLogs.length > 0 ? (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {recentLogs.map((log) => {
                                    let logDate: Date;
                                    if (typeof log.timestamp === 'number') logDate = new Date(log.timestamp * 1000);
                                    else logDate = new Date(log.timestamp || new Date());

                                    return (
                                        <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                            <div className="bg-primary/10 p-1.5 rounded-full mt-0.5">
                                                <Activity className="h-3 w-3 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm leading-snug">{log.action}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-medium text-slate-500">{log.user}</span>
                                                    <span className="text-xs text-slate-400">
                                                        {logDate.toLocaleString('id-ID', {
                                                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-sm text-slate-500 flex h-32 items-center justify-center border rounded-md border-dashed bg-secondary/20">
                                Tidak ada aktivitas yang tersimpan di bulan ini.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

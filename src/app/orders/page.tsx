import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { db } from "@/db"
import { salesReports, salesReportDetails } from "@/db/schema"
import { eq, desc, sql } from "drizzle-orm"
import { FileSpreadsheet, CheckCircle2, AlertCircle, Upload } from "lucide-react"

export default async function OrdersPage() {
    const reports = await db.select().from(salesReports).orderBy(desc(salesReports.waktu_upload));

    // Get detail counts per report
    const detailCounts: Record<string, { total: number; matched: number; unmatched: number }> = {};
    const allDetails = await db.select().from(salesReportDetails);
    for (const d of allDetails) {
        if (!detailCounts[d.report_id]) {
            detailCounts[d.report_id] = { total: 0, matched: 0, unmatched: 0 };
        }
        detailCounts[d.report_id].total++;
        if (d.match_status === 'matched') {
            detailCounts[d.report_id].matched++;
        } else {
            detailCounts[d.report_id].unmatched++;
        }
    }

    const totalMatched = allDetails.filter(d => d.match_status === 'matched').length;
    const totalUnmatched = allDetails.filter(d => d.match_status === 'unmatched').length;

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Upload History</h2>
                <p className="text-slate-500 dark:text-slate-400">Riwayat upload file .xls laporan penjualan beserta status parsing.</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 dark:bg-blue-500/20 p-2.5 rounded-xl">
                                <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{reports.length}</p>
                                <p className="text-xs text-slate-500">Total Upload</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2.5 rounded-xl">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalMatched}</p>
                                <p className="text-xs text-slate-500">Item Matched</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-100 dark:bg-red-500/20 p-2.5 rounded-xl">
                                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalUnmatched}</p>
                                <p className="text-xs text-slate-500">Item Unmatched</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Reports Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Upload Reports</CardTitle>
                    <CardDescription>Setiap file .xls yang diunggah akan diparse dan dicatat di sini beserta jumlah item yang berhasil dicocokkan.</CardDescription>
                </CardHeader>
                <CardContent>
                    {reports.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[100px]">Report ID</TableHead>
                                        <TableHead className="min-w-[200px]">Nama File</TableHead>
                                        <TableHead className="min-w-[100px]">Outlet</TableHead>
                                        <TableHead className="min-w-[100px]">Status</TableHead>
                                        <TableHead className="text-center min-w-[80px]">Matched</TableHead>
                                        <TableHead className="text-center min-w-[80px]">Unmatched</TableHead>
                                        <TableHead className="text-right min-w-[140px]">Waktu Upload</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reports.map(r => {
                                        const counts = detailCounts[r.id] || { total: 0, matched: 0, unmatched: 0 };
                                        const uploadDate = r.waktu_upload
                                            ? new Date(Number(r.waktu_upload) * 1000).toLocaleString('id-ID', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })
                                            : '-';
                                        return (
                                            <TableRow key={r.id}>
                                                <TableCell className="font-mono text-xs">{r.id.slice(0, 12)}...</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                                                        <span className="font-medium truncate max-w-[200px]">{r.file_name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{r.outlet_id}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {r.upload_status === 'parsed' ? (
                                                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-0">
                                                            <CheckCircle2 className="h-3 w-3 mr-1" /> Parsed
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="destructive">
                                                            <AlertCircle className="h-3 w-3 mr-1" /> Failed
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-emerald-600 font-medium">{counts.matched}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className={counts.unmatched > 0 ? "text-red-500 font-medium" : "text-slate-400"}>{counts.unmatched}</span>
                                                </TableCell>
                                                <TableCell className="text-right text-slate-500 text-sm">{uploadDate}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-sm text-slate-500 flex h-32 items-center justify-center border rounded-md border-dashed">
                            Belum ada upload. Gunakan Dropzone di Dashboard untuk mengunggah file .xls.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

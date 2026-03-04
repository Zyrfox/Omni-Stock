import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { db } from "@/db"
import { uploadBatches, uploadBatchDetails } from "@/db/schema"
import { desc } from "drizzle-orm"
import { CheckCircle2, AlertCircle, Upload } from "lucide-react"
import { UploadDetailsModal } from "@/components/orders/UploadDetailsModal"

export default async function OrdersPage() {
    const batches = await db.select().from(uploadBatches).orderBy(desc(uploadBatches.created_at));
    const allDetails = await db.select().from(uploadBatchDetails);

    const totalMatched = allDetails.filter(d => d.is_matched).length;
    const totalUnmatched = allDetails.filter(d => !d.is_matched).length;

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Upload History (Stock Tracker)</h2>
                <p className="text-slate-500 dark:text-slate-400">Arsip riwayat upload Kartu Stok dari setiap Outlet beserta analisis kecocokan Master Data.</p>
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
                                <p className="text-2xl font-bold">{batches.length}</p>
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
                    <CardTitle>Physical Upload Logs</CardTitle>
                    <CardDescription>Menampilkan kapan update master stock dilakukan pada gudang secara spesifik.</CardDescription>
                </CardHeader>
                <CardContent>
                    {batches.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[100px]">Batch ID</TableHead>
                                        <TableHead className="min-w-[140px]">Outlet</TableHead>
                                        <TableHead className="min-w-[100px]">Status</TableHead>
                                        <TableHead className="text-center min-w-[80px]">Matched</TableHead>
                                        <TableHead className="text-center min-w-[80px]">Unmatched</TableHead>
                                        <TableHead className="text-right min-w-[160px]">Waktu Upload</TableHead>
                                        <TableHead className="text-right min-w-[120px]">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {batches.map(b => {
                                        const relatedDetails = allDetails.filter(d => d.batch_id === b.id);
                                        const matchedCount = relatedDetails.filter(d => d.is_matched).length;
                                        const unmatchedCount = relatedDetails.filter(d => !d.is_matched).length;

                                        const uploadDate = b.created_at
                                            ? new Date(b.created_at).toLocaleString('id-ID', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })
                                            : '-';

                                        return (
                                            <TableRow key={b.id}>
                                                <TableCell className="font-mono text-xs select-all uppercase">{b.id.split('-')[0]}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-secondary/50 font-semibold">{b.outlet_id}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-0">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Sukses
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-emerald-600 font-semibold">{matchedCount}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className={unmatchedCount > 0 ? "text-red-500 font-bold" : "text-slate-400 font-medium"}>
                                                        {unmatchedCount}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right text-slate-500 text-sm font-medium">{uploadDate}</TableCell>
                                                <TableCell className="text-right">
                                                    <UploadDetailsModal batchId={b.id} details={relatedDetails} />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-sm text-slate-500 flex flex-col h-40 items-center justify-center border rounded-md border-dashed bg-secondary/20">
                            <Upload className="h-8 w-8 text-muted-foreground mb-3 opacity-50" />
                            <p>Belum ada upload kartu stok di sistem.</p>
                            <p className="text-xs max-w-sm text-center mt-1">Lakukan drag and drop Kartu Stok melalui Command Center Dashboard.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

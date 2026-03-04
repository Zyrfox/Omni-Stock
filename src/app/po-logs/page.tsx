import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { db } from "@/db"
import { logPO, masterBahan, masterVendor } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { CopyPOButton } from "@/components/po-logs/CopyPOButton"
import { ApprovePOButton } from "@/components/po-logs/ApprovePOButton"
import { LastSyncedBadge } from "@/components/ui/LastSyncedBadge"
import { Suspense } from "react"

export default async function POLogsPage() {
    const logsData = await db
        .select({
            id: logPO.id,
            status: logPO.status,
            tanggal_po: logPO.tanggal_po,
            bahan_nama: masterBahan.nama_bahan,
            vendor_nama: masterVendor.nama_vendor,
            vendor_wa: masterVendor.kontak_wa
        })
        .from(logPO)
        .leftJoin(masterBahan, eq(logPO.bahan_id, masterBahan.id))
        .leftJoin(masterVendor, eq(logPO.vendor_id, masterVendor.id))
        .orderBy(desc(logPO.tanggal_po));

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">PO Logs</h2>
                <p className="text-slate-500 dark:text-slate-400">History of Purchase Orders generated automatically based on minimum stock alerts.</p>
            </div>

            <Suspense fallback={null}>
                <LastSyncedBadge />
            </Suspense>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Purchase Orders</CardTitle>
                    <CardDescription>All automaticly drafted Purchase Orders from inventory deduction.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[80px] whitespace-nowrap">PO ID</TableHead>
                                    <TableHead className="min-w-[120px] whitespace-nowrap">Vendor</TableHead>
                                    <TableHead className="min-w-[150px] whitespace-nowrap">Bahan (Item)</TableHead>
                                    <TableHead className="min-w-[180px] whitespace-nowrap">Status</TableHead>
                                    <TableHead className="text-right min-w-[100px] whitespace-nowrap">Tanggal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logsData.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-mono text-xs whitespace-nowrap">{log.id.slice(0, 8)}...</TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {log.vendor_nama || '-'}
                                            {log.vendor_wa && <span className="block text-xs text-slate-400">{log.vendor_wa}</span>}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{log.bahan_nama || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {log.status === 'draft' ? (
                                                <div className="flex items-center">
                                                    <Badge variant="outline" className="text-amber-600 bg-amber-50">Menunggu Approval Manager</Badge>
                                                    <CopyPOButton
                                                        poId={log.id}
                                                        bahanName={log.bahan_nama || 'Unknown'}
                                                        vendorName={log.vendor_nama || 'Unknown'}
                                                    />
                                                    <ApprovePOButton poId={log.id} />
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-green-600 bg-green-50">Approved</Badge>
                                                    <ApprovePOButton poId={log.id} isUndo={true} />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right text-slate-500 whitespace-nowrap">
                                            {log.tanggal_po
                                                ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(log.tanggal_po))
                                                : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {logsData.length === 0 && (
                                    <TableRow><TableCell colSpan={5} className="text-center text-slate-500 h-24">No Purchase Orders have been generated yet.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { db } from "@/db"
import { invoices, invoiceItems } from "@/db/schema"
import { desc, eq } from "drizzle-orm"
import { InvoiceActions } from "@/components/po-logs/InvoiceActions"
import { LastSyncedBadge } from "@/components/ui/LastSyncedBadge"
import { Suspense } from "react"

export default async function POLogsPage() {
    // Fetch all generated invoices
    const allInvoices = await db.select().from(invoices).orderBy(desc(invoices.created_at));

    // Fetch all invoice items (in a real app with large data, we'd paginate or fetch on-demand)
    const allItems = await db.select().from(invoiceItems);

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">PO Logs & Invoices</h2>
                <p className="text-slate-500 dark:text-slate-400">Arsip permanen Purchase Orders yang telah di-Approve dan digenerate menjadi Invoice.</p>
            </div>

            <Suspense fallback={null}>
                <LastSyncedBadge />
            </Suspense>

            <Card>
                <CardHeader>
                    <CardTitle>Approved Invoice Vault</CardTitle>
                    <CardDescription>Daftar invoice berdasarkan vendor yang telah disetujui.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[120px] whitespace-nowrap">Invoice ID</TableHead>
                                    <TableHead className="min-w-[150px] whitespace-nowrap">Tanggal Dibuat</TableHead>
                                    <TableHead className="min-w-[150px] whitespace-nowrap">Vendor</TableHead>
                                    <TableHead className="text-center min-w-[100px] whitespace-nowrap">Total Item</TableHead>
                                    <TableHead className="text-right min-w-[150px] whitespace-nowrap">Total Biaya (Rp)</TableHead>
                                    <TableHead className="min-w-[120px] whitespace-nowrap">Status</TableHead>
                                    <TableHead className="min-w-[180px] text-right whitespace-nowrap">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allInvoices.map((inv) => {
                                    const relatedItems = allItems.filter(item => item.invoice_id === inv.id);

                                    return (
                                        <TableRow key={inv.id}>
                                            <TableCell className="font-mono text-xs whitespace-nowrap uppercase">{inv.id.split('-')[0]}</TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {inv.created_at
                                                    ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(inv.created_at))
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="font-semibold whitespace-nowrap">{inv.vendor_nama}</TableCell>
                                            <TableCell className="text-center whitespace-nowrap">{inv.total_items} item</TableCell>
                                            <TableCell className="text-right font-bold whitespace-nowrap text-amber-600 dark:text-amber-500">
                                                Rp {inv.total_biaya.toLocaleString('id-ID')}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <Badge variant="outline" className={inv.status === 'PAID' ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-amber-600 bg-amber-50 border-amber-200"}>
                                                    {inv.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-right flex justify-end">
                                                <InvoiceActions invoiceId={inv.id} vendorName={inv.vendor_nama} items={relatedItems} />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {allInvoices.length === 0 && (
                                    <TableRow><TableCell colSpan={7} className="text-center text-slate-500 h-24">Belum ada Invoice yang digenerate.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

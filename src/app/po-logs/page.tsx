import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { db } from "@/db"
import { invoices, invoiceItems } from "@/db/schema"
import { desc, eq } from "drizzle-orm"
import { InvoiceActions } from "@/components/po-logs/InvoiceActions"
import { InvoiceFilters } from "@/components/po-logs/InvoiceFilters"
import { LastSyncedBadge } from "@/components/ui/LastSyncedBadge"
import { Suspense } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Calendar } from "lucide-react"

export default async function POLogsPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    // Determine filters from URL
    const statusFilter = typeof searchParams.status === 'string' ? searchParams.status : 'ALL';
    const vendorFilter = typeof searchParams.vendor === 'string' ? searchParams.vendor : 'ALL';

    // Construct query conditions array
    const conditions = [];

    // Convert generic UNPAID/PAID UI statuses to specific database ENUM if needed. 
    // In our DB, "PAID" means Lunas. Others like "DRAFT", "APPROVED". 
    // We treat "UNPAID" as meaning either "DRAFT" or "APPROVED" essentially, or just strictly check.
    if (statusFilter !== 'ALL') {
        if (statusFilter === 'UNPAID') {
            // Technically anything not PAID is UNPAID, but for simplicity we rely on 'DRAFT' and 'APPROVED' directly
            conditions.push(eq(invoices.status, 'APPROVED')); // Normally UNPAID might encompass many, let's keep it exact or handle specific cases
        } else {
            conditions.push(eq(invoices.status, statusFilter));
        }
    }

    if (vendorFilter !== 'ALL') {
        conditions.push(eq(invoices.vendor_nama, vendorFilter));
    }

    // Dynamic import to combine conditions securely using "and"
    const { and } = await import("drizzle-orm");

    // Fetch filtered invoices
    const allInvoices = await db.select().from(invoices)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(invoices.created_at));

    // Fetch all invoice items (in a real app with large data, we'd paginate or fetch on-demand)
    const allItems = await db.select().from(invoiceItems);

    // Extract unique vendors for the filter dropdown
    // We do a separate lightweight query or extract from all existing known invoices
    const allVendorsRows = await db.selectDistinct({ vendor: invoices.vendor_nama }).from(invoices);
    const uniqueVendors = allVendorsRows.map(row => row.vendor).filter(Boolean);

    // Dynamic grouping by Date
    const groupedInvoices = allInvoices.reduce((acc, inv) => {
        const dateStr = inv.created_at ? new Date(inv.created_at).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        }) : 'Unknown Date';
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(inv);
        return acc;
    }, {} as Record<string, typeof allInvoices>);

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">PO Logs & Invoices</h2>
                <p className="text-slate-500 dark:text-slate-400">Arsip permanen Purchase Orders yang telah di-Approve dan digenerate menjadi Invoice.</p>
            </div>

            <Suspense fallback={null}>
                <LastSyncedBadge />
            </Suspense>

            {/* Filter Bar */}
            <Suspense fallback={<div>Loading filters...</div>}>
                <InvoiceFilters vendors={uniqueVendors} />
            </Suspense>

            {/* Accordion Grouped by Date */}
            <div className="space-y-4">
                {allInvoices.length > 0 ? (
                    <Accordion type="multiple" className="w-full space-y-4">
                        {Object.entries(groupedInvoices).map(([dateLabel, dayInvoices]) => (
                            <AccordionItem value={dateLabel} key={dateLabel} className="border bg-card text-card-foreground rounded-lg overflow-hidden shadow-sm px-2">
                                <AccordionTrigger className="hover:no-underline px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 p-2 rounded-md">
                                            <Calendar className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="font-semibold text-lg">{dateLabel}</span>
                                            <span className="text-sm font-normal text-muted-foreground">{dayInvoices.length} PO / Invoice{dayInvoices.length > 1 ? 's' : ''} Record</span>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 px-4 pb-4">
                                    <div className="overflow-x-auto border rounded-md">
                                        <Table>
                                            <TableHeader className="bg-secondary/30">
                                                <TableRow>
                                                    <TableHead className="min-w-[120px] whitespace-nowrap">Invoice ID</TableHead>
                                                    <TableHead className="min-w-[150px] whitespace-nowrap">Waktu Dibuat</TableHead>
                                                    <TableHead className="min-w-[150px] whitespace-nowrap">Vendor</TableHead>
                                                    <TableHead className="text-center min-w-[100px] whitespace-nowrap">Total Item</TableHead>
                                                    <TableHead className="text-right min-w-[150px] whitespace-nowrap">Total Biaya (Rp)</TableHead>
                                                    <TableHead className="min-w-[120px] whitespace-nowrap">PIC (User)</TableHead>
                                                    <TableHead className="min-w-[120px] whitespace-nowrap">Status</TableHead>
                                                    <TableHead className="min-w-[180px] text-right whitespace-nowrap">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {dayInvoices.map((inv) => {
                                                    const relatedItems = allItems.filter(item => item.invoice_id === inv.id);

                                                    return (
                                                        <TableRow key={inv.id} className="hover:bg-secondary/20">
                                                            <TableCell className="font-mono text-xs whitespace-nowrap uppercase">{inv.id.split('-')[0]}</TableCell>
                                                            <TableCell className="whitespace-nowrap">
                                                                {inv.created_at
                                                                    ? new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(inv.created_at))
                                                                    : '-'}
                                                            </TableCell>
                                                            <TableCell className="font-semibold whitespace-nowrap">{inv.vendor_nama}</TableCell>
                                                            <TableCell className="text-center whitespace-nowrap">{inv.total_items} item</TableCell>
                                                            <TableCell className="text-right font-bold whitespace-nowrap text-amber-600 dark:text-amber-500">
                                                                Rp {inv.total_biaya.toLocaleString('id-ID')}
                                                            </TableCell>
                                                            <TableCell className="whitespace-nowrap font-medium text-muted-foreground">{inv.created_by || 'System'}</TableCell>
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
                                            </TableBody>
                                        </Table>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <Card>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center p-8 h-40">
                                <p className="font-medium text-foreground">Tidak ada dokumen ditemukan</p>
                                <p className="text-sm mt-1 text-muted-foreground">Belum ada PO / Invoice yang sesuai dengan filter yang dipilih.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

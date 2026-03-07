import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/db";
import { invoices, invoiceItems, masterVendor } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ArrowLeft, TrendingUp, Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
    params: {
        vendorId: string;
    };
}

export default async function VendorAuditPage({ params }: PageProps) {
    const rawVendorId = decodeURIComponent(params.vendorId);

    // Attempt to lookup real vendor name from ID
    const vendorRecord = await db.select().from(masterVendor).where(eq(masterVendor.id, rawVendorId)).limit(1);
    const vendorName = vendorRecord.length > 0 ? vendorRecord[0].nama_vendor : rawVendorId;

    // Fetch all invoices for this vendor
    const vendorInvoices = await db.select()
        .from(invoices)
        .where(eq(invoices.vendor_nama, vendorName))
        .orderBy(desc(invoices.created_at));

    const invoiceIds = vendorInvoices.map(inv => inv.id);
    let items: Array<{
        id: string;
        invoice_id: string;
        bahan_id: string;
        nama_bahan: string;
        qty: number;
        harga_satuan: number;
    }> = [];

    if (invoiceIds.length > 0) {
        // Fetch all items from those invoices
        // Since sqlite/pg `in` clause might need special handling if empty, we guarded it
        const allItems = await db.select().from(invoiceItems);
        items = allItems.filter(item => invoiceIds.includes(item.invoice_id));
    }

    const totalSpend = vendorInvoices.reduce((sum, inv) => sum + inv.total_biaya, 0);
    const totalOrders = vendorInvoices.length;

    // Aggregate items to see what is bought most from this vendor
    const itemStats: Record<string, { nama: string, qty: number, spent: number, frequency: number }> = {};
    items.forEach(item => {
        if (!itemStats[item.bahan_id]) {
            itemStats[item.bahan_id] = { nama: item.nama_bahan, qty: 0, spent: 0, frequency: 0 };
        }
        itemStats[item.bahan_id].qty += item.qty;
        itemStats[item.bahan_id].spent += (item.qty * item.harga_satuan);
        itemStats[item.bahan_id].frequency += 1;
    });

    const topItems = Object.values(itemStats).sort((a, b) => b.spent - a.spent);

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/">
                    <Button variant="outline" size="icon" className="h-10 w-10">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-500">
                        {vendorName}
                    </h1>
                    <p className="text-muted-foreground">Laporan historis pengeluaran dan frekuensi PO Vendor.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-rose-500/20 bg-rose-500/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-rose-600 dark:text-rose-400 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Total Pengeluaran
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">Rp {totalSpend.toLocaleString('id-ID')}</div>
                    </CardContent>
                </Card>
                <Card className="border-blue-500/20 bg-blue-500/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
                            <Package className="h-4 w-4" /> Total Frekuensi PO
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalOrders} <span className="text-lg font-normal text-muted-foreground">Invoice(s)</span></div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Rincian Pembelian Bahan</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-secondary/50">
                                <TableRow>
                                    <TableHead>Nama Bahan</TableHead>
                                    <TableHead className="text-right">Frekuensi Beli</TableHead>
                                    <TableHead className="text-right">Total Qty</TableHead>
                                    <TableHead className="text-right">Total Pengeluaran</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topItems.length > 0 ? topItems.map((item, i) => (
                                    <TableRow key={i} className="hover:bg-secondary/20">
                                        <TableCell className="font-medium">{item.nama}</TableCell>
                                        <TableCell className="text-right">{item.frequency}x</TableCell>
                                        <TableCell className="text-right">{item.qty.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-mono font-semibold">Rp {item.spent.toLocaleString('id-ID')}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Tidak ada histori pembelian dari vendor ini.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/db"
import { invoices, masterVendor } from "@/db/schema"
import Link from "next/link";

export async function AuditPengeluaran() {
    // Analyze expenditure directly from approved/paid POS 
    const allInvoices = await db.select().from(invoices);
    const allVendors = await db.select().from(masterVendor);
    const vendorNameMap = new Map();
    allVendors.forEach(v => vendorNameMap.set(v.nama_vendor, v.id));

    const vendorSpend: Record<string, number> = {};
    let totalSpend = 0;

    allInvoices.forEach(inv => {
        const v = inv.vendor_nama;
        if (!vendorSpend[v]) vendorSpend[v] = 0;
        vendorSpend[v] += (inv.total_biaya || 0);
        totalSpend += (inv.total_biaya || 0);
    });

    const topVendors = Object.entries(vendorSpend)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);

    return (
        <Card className="h-full border-rose-500/10 shadow-lg relative overflow-hidden">
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg text-rose-700 dark:text-rose-400">💸 Audit Pengeluaran</CardTitle>
                <CardDescription>Top Spender / Vendor (PO Historis)</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-1">Total Outstanding/Paid</p>
                    <p className="text-2xl font-bold tracking-tight">Rp {totalSpend.toLocaleString('id-ID')}</p>
                </div>
                <div className="space-y-3">
                    {topVendors.length > 0 ? topVendors.map(([vendor, spend], idx) => {
                        const percentage = totalSpend > 0 ? (spend / totalSpend) * 100 : 0;
                        const vendorId = vendorNameMap.get(vendor) || encodeURIComponent(vendor);
                        return (
                            <Link href={`/suppliers/${vendorId}`} key={vendor} className="space-y-1 block hover:bg-rose-500/10 p-2 -mx-2 rounded-lg transition-colors group cursor-pointer">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium truncate max-w-[150px] group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{vendor}</span>
                                    <span className="font-mono font-semibold">Rp {spend.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                                </div>
                            </Link>
                        )
                    }) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Belum ada riwayat tagihan PO.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

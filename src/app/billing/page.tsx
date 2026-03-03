import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { db } from "@/db"
import { logPO, masterBahan, masterVendor } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { Receipt, DollarSign, Clock, CheckCircle2 } from "lucide-react"

export default async function BillingPage() {
    // Show PO summary grouped by vendor for billing/invoicing visibility
    const allPO = await db
        .select({
            id: logPO.id,
            status: logPO.status,
            tanggal_po: logPO.tanggal_po,
            bahan_id: logPO.bahan_id,
            vendor_id: logPO.vendor_id,
            bahan_nama: masterBahan.nama_bahan,
            satuan: masterBahan.satuan_dasar,
            vendor_nama: masterVendor.nama_vendor,
            vendor_wa: masterVendor.kontak_wa,
        })
        .from(logPO)
        .leftJoin(masterBahan, eq(logPO.bahan_id, masterBahan.id))
        .leftJoin(masterVendor, eq(logPO.vendor_id, masterVendor.id))
        .orderBy(desc(logPO.tanggal_po));

    // Group by vendor
    const vendorGroups = new Map<string, {
        vendor_nama: string;
        vendor_wa: string | null;
        draft: number;
        approved: number;
        items: string[];
    }>();

    for (const po of allPO) {
        const vid = po.vendor_id || 'UNKNOWN';
        if (!vendorGroups.has(vid)) {
            vendorGroups.set(vid, {
                vendor_nama: po.vendor_nama || vid,
                vendor_wa: po.vendor_wa,
                draft: 0,
                approved: 0,
                items: [],
            });
        }
        const g = vendorGroups.get(vid)!;
        if (po.status === 'draft') g.draft++;
        else g.approved++;
        if (po.bahan_nama && !g.items.includes(po.bahan_nama)) {
            g.items.push(po.bahan_nama);
        }
    }

    const totalDraft = allPO.filter(p => p.status === 'draft').length;
    const totalApproved = allPO.filter(p => p.status === 'approved').length;
    const vendorList = Array.from(vendorGroups.entries());

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Billing</h2>
                <p className="text-slate-500 dark:text-slate-400">Ringkasan Purchase Order per vendor untuk keperluan billing dan invoice tracking.</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 dark:bg-blue-500/20 p-2.5 rounded-xl">
                                <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{allPO.length}</p>
                                <p className="text-xs text-slate-500">Total PO</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-100 dark:bg-amber-500/20 p-2.5 rounded-xl">
                                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalDraft}</p>
                                <p className="text-xs text-slate-500">Draft (Pending)</p>
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
                                <p className="text-2xl font-bold">{totalApproved}</p>
                                <p className="text-xs text-slate-500">Approved</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Vendor Billing Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>PO per Vendor</CardTitle>
                    <CardDescription>Ringkasan jumlah Purchase Order yang dikelompokkan berdasarkan vendor penyuplai.</CardDescription>
                </CardHeader>
                <CardContent>
                    {vendorList.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[180px]">Vendor</TableHead>
                                        <TableHead className="min-w-[140px]">Kontak</TableHead>
                                        <TableHead className="text-center min-w-[80px]">Draft</TableHead>
                                        <TableHead className="text-center min-w-[80px]">Approved</TableHead>
                                        <TableHead className="min-w-[250px]">Item Terkait</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {vendorList.map(([vid, g]) => (
                                        <TableRow key={vid}>
                                            <TableCell className="font-medium">{g.vendor_nama}</TableCell>
                                            <TableCell>
                                                {g.vendor_wa ? (
                                                    <span className="text-emerald-600 text-sm">{g.vendor_wa}</span>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {g.draft > 0 ? (
                                                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-0">{g.draft}</Badge>
                                                ) : (
                                                    <span className="text-slate-400">0</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {g.approved > 0 ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-0">{g.approved}</Badge>
                                                ) : (
                                                    <span className="text-slate-400">0</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {g.items.slice(0, 4).map((name, i) => (
                                                        <Badge key={i} variant="secondary" className="text-xs font-normal">{name}</Badge>
                                                    ))}
                                                    {g.items.length > 4 && (
                                                        <Badge variant="secondary" className="text-xs font-normal opacity-60">+{g.items.length - 4}</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-sm text-slate-500 flex h-32 items-center justify-center border rounded-md border-dashed">
                            Belum ada Purchase Order. PO otomatis dibuat ketika stok berada di bawah batas minimum setelah upload.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

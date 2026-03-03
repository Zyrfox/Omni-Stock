import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { db } from "@/db"
import { masterVendor, masterBahan } from "@/db/schema"
import { eq } from "drizzle-orm"
import { Truck, Package, Phone } from "lucide-react"

export default async function SuppliersPage() {
    const vendors = await db.select().from(masterVendor);

    // Count bahan per vendor
    const bahanCounts: Record<string, number> = {};
    const allBahan = await db.select().from(masterBahan);
    for (const b of allBahan) {
        if (b.vendor_id) {
            bahanCounts[b.vendor_id] = (bahanCounts[b.vendor_id] || 0) + 1;
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Suppliers</h2>
                <p className="text-slate-500 dark:text-slate-400">Daftar vendor penyedia bahan baku yang tersinkronisasi dari Master Data.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 dark:bg-blue-500/20 p-2.5 rounded-xl">
                                <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{vendors.length}</p>
                                <p className="text-xs text-slate-500">Total Vendor</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2.5 rounded-xl">
                                <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{allBahan.length}</p>
                                <p className="text-xs text-slate-500">Total Bahan Baku</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-100 dark:bg-amber-500/20 p-2.5 rounded-xl">
                                <Phone className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{vendors.filter(v => v.kontak_wa).length}</p>
                                <p className="text-xs text-slate-500">Vendor dengan WA</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Vendor Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Vendor</CardTitle>
                    <CardDescription>Semua vendor penyedia bahan baku beserta informasi kontak dan jumlah item yang disuplai.</CardDescription>
                </CardHeader>
                <CardContent>
                    {vendors.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[100px]">Vendor ID</TableHead>
                                        <TableHead className="min-w-[180px]">Nama Vendor</TableHead>
                                        <TableHead className="min-w-[150px]">Kontak WhatsApp</TableHead>
                                        <TableHead className="text-center min-w-[120px]">Jumlah Item</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {vendors.map(v => (
                                        <TableRow key={v.id}>
                                            <TableCell className="font-mono text-xs">{v.id}</TableCell>
                                            <TableCell className="font-medium">{v.nama_vendor}</TableCell>
                                            <TableCell>
                                                {v.kontak_wa ? (
                                                    <a
                                                        href={`https://wa.me/${v.kontak_wa.replace(/[^0-9]/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-emerald-600 hover:underline flex items-center gap-1.5"
                                                    >
                                                        <Phone className="h-3.5 w-3.5" />
                                                        {v.kontak_wa}
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline">{bahanCounts[v.id] || 0} item</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-sm text-slate-500 flex h-32 items-center justify-center border rounded-md border-dashed">
                            Belum ada data vendor. Silakan sync Master Data dari Settings.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

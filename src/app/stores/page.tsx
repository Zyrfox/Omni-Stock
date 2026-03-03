import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { db } from "@/db"
import { masterMenu, inventoryState, masterBahan } from "@/db/schema"
import { Store, Package, AlertTriangle } from "lucide-react"

export default async function StoresPage() {
    const menus = await db.select().from(masterMenu);
    const allStock = await db.select().from(inventoryState);
    const allBahan = await db.select().from(masterBahan);

    // Group menus by outlet
    const outletMap = new Map<string, { menuCount: number; menuNames: string[] }>();
    for (const m of menus) {
        if (!outletMap.has(m.outlet_id)) {
            outletMap.set(m.outlet_id, { menuCount: 0, menuNames: [] });
        }
        const entry = outletMap.get(m.outlet_id)!;
        entry.menuCount++;
        if (entry.menuNames.length < 5) {
            entry.menuNames.push(m.nama_menu);
        }
    }

    // Count low stock items
    const lowStockCount = allStock.filter(s => {
        const bahan = allBahan.find(b => b.id === s.id_bahan);
        return bahan && s.current_stock <= bahan.batas_minimum;
    }).length;

    const outlets = Array.from(outletMap.entries()).map(([id, data]) => ({
        id,
        ...data,
    }));

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Stores</h2>
                <p className="text-slate-500 dark:text-slate-400">Overview outlet berdasarkan data Master Menu yang tersinkronisasi.</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2.5 rounded-xl">
                                <Store className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{outlets.length}</p>
                                <p className="text-xs text-slate-500">Total Outlet</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-violet-100 dark:bg-violet-500/20 p-2.5 rounded-xl">
                                <Package className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{allStock.length}</p>
                                <p className="text-xs text-slate-500">Item Inventory</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-100 dark:bg-amber-500/20 p-2.5 rounded-xl">
                                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{lowStockCount}</p>
                                <p className="text-xs text-slate-500">Low Stock Items</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Outlets Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Outlet</CardTitle>
                    <CardDescription>Outlet diidentifikasi dari kolom outlet_id pada Master Menu. Setiap outlet menampilkan jumlah menu yang tersedia.</CardDescription>
                </CardHeader>
                <CardContent>
                    {outlets.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[120px]">Outlet ID</TableHead>
                                        <TableHead className="text-center min-w-[100px]">Jumlah Menu</TableHead>
                                        <TableHead className="min-w-[300px]">Sample Menu</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {outlets.map(o => (
                                        <TableRow key={o.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Store className="h-4 w-4 text-indigo-500" />
                                                    <span className="font-medium">{o.id}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline">{o.menuCount} menu</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {o.menuNames.map((name, i) => (
                                                        <Badge key={i} variant="secondary" className="text-xs font-normal">
                                                            {name}
                                                        </Badge>
                                                    ))}
                                                    {o.menuCount > 5 && (
                                                        <Badge variant="secondary" className="text-xs font-normal opacity-60">
                                                            +{o.menuCount - 5} lagi
                                                        </Badge>
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
                            Belum ada outlet. Data outlet otomatis muncul setelah sync Master Menu.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { db } from "@/db"
import { masterMenu, mappingResep, masterBahan } from "@/db/schema"
import { eq } from "drizzle-orm"
import { Package, Utensils, Layers } from "lucide-react"

interface ResepDetail {
    bahan_nama: string;
    jumlah_pakai: number;
    satuan: string;
    station: string | null;
}

export default async function ProductsPage() {
    const menus = await db.select().from(masterMenu);
    const allResep = await db.select().from(mappingResep);
    const allBahan = await db.select().from(masterBahan);

    // Build bahan lookup
    const bahanMap = new Map<string, typeof allBahan[0]>();
    for (const b of allBahan) {
        bahanMap.set(b.id, b);
    }

    // Build resep per menu
    const resepPerMenu = new Map<string, ResepDetail[]>();
    for (const r of allResep) {
        const bahan = bahanMap.get(r.bahan_id);
        if (!resepPerMenu.has(r.menu_id)) {
            resepPerMenu.set(r.menu_id, []);
        }
        resepPerMenu.get(r.menu_id)!.push({
            bahan_nama: bahan?.nama_bahan || r.bahan_id,
            jumlah_pakai: r.jumlah_pakai,
            satuan: bahan?.satuan_dasar || 'pcs',
            station: r.station,
        });
    }

    // Count unique outlets
    const outlets = new Set(menus.map(m => m.outlet_id));

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Products</h2>
                <p className="text-slate-500 dark:text-slate-400">Daftar menu POS beserta komposisi resep bahan baku.</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-violet-100 dark:bg-violet-500/20 p-2.5 rounded-xl">
                                <Utensils className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{menus.length}</p>
                                <p className="text-xs text-slate-500">Total Menu</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-pink-100 dark:bg-pink-500/20 p-2.5 rounded-xl">
                                <Layers className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{allResep.length}</p>
                                <p className="text-xs text-slate-500">Total Mapping Resep</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-cyan-100 dark:bg-cyan-500/20 p-2.5 rounded-xl">
                                <Package className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{outlets.size}</p>
                                <p className="text-xs text-slate-500">Outlet Aktif</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Product Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Menu & Resep</CardTitle>
                    <CardDescription>Setiap menu menampilkan komposisi bahan baku (resep) yang digunakan saat pemotongan stok.</CardDescription>
                </CardHeader>
                <CardContent>
                    {menus.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[100px]">ID</TableHead>
                                        <TableHead className="min-w-[200px]">Nama Menu</TableHead>
                                        <TableHead className="min-w-[100px]">Outlet</TableHead>
                                        <TableHead className="min-w-[300px]">Komposisi Resep</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {menus.map(m => {
                                        const reseps = resepPerMenu.get(m.id) || [];
                                        return (
                                            <TableRow key={m.id}>
                                                <TableCell className="font-mono text-xs">{m.id}</TableCell>
                                                <TableCell className="font-medium">{m.nama_menu}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{m.outlet_id}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {reseps.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {reseps.map((r, i) => (
                                                                <Badge
                                                                    key={i}
                                                                    variant="secondary"
                                                                    className="text-xs font-normal"
                                                                >
                                                                    {r.bahan_nama} ({r.jumlah_pakai} {r.satuan})
                                                                    {r.station && <span className="ml-1 opacity-60">• {r.station}</span>}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs">Belum ada resep</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-sm text-slate-500 flex h-32 items-center justify-center border rounded-md border-dashed">
                            Belum ada data menu. Silakan sync Master Data dari Settings.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

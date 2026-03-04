import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db } from "@/db"
import { masterMenu, mappingResep, masterBahan } from "@/db/schema"
import { eq } from "drizzle-orm"
import { Package, Utensils, Layers, ChevronRight, Store } from "lucide-react"
import { ProductModal } from "@/components/products/ProductModal"
import Link from "next/link"
import { resolveOutletName } from "@/lib/outlets"
import { LastSyncedBadge } from "@/components/ui/LastSyncedBadge"

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

    // Group menus by outlet (prefix from ID)
    const outletGroups = new Map<string, typeof menus>();
    for (const m of menus) {
        const prefix = m.id.split('_')[0];
        const outletName = resolveOutletName(m.id);
        const key = `${prefix}||${outletName}`;
        if (!outletGroups.has(key)) {
            outletGroups.set(key, []);
        }
        outletGroups.get(key)!.push(m);
    }

    const outletEntries = Array.from(outletGroups.entries()).map(([key, items]) => {
        const [prefix, name] = key.split('||');
        return { prefix, name, items };
    });

    // Count unique outlets
    const outlets = new Set(outletEntries.map(e => e.prefix));

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Products</h2>
                    <p className="text-slate-500 dark:text-slate-400">Daftar menu POS beserta komposisi resep bahan baku.</p>
                </div>
                <LastSyncedBadge />
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/products" className="group">
                    <Card className="cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-lime-500/50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-violet-100 dark:bg-violet-500/20 p-2.5 rounded-xl">
                                        <Utensils className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{menus.length}</p>
                                        <p className="text-xs text-slate-500">Total Menu</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-lime-500 transition-all" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/products" className="group">
                    <Card className="cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-lime-500/50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-pink-100 dark:bg-pink-500/20 p-2.5 rounded-xl">
                                        <Layers className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{allResep.length}</p>
                                        <p className="text-xs text-slate-500">Total Mapping Resep</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-lime-500 transition-all" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/stores" className="group">
                    <Card className="cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-lime-500/50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-cyan-100 dark:bg-cyan-500/20 p-2.5 rounded-xl">
                                        <Package className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{outlets.size}</p>
                                        <p className="text-xs text-slate-500">Outlet Aktif</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-lime-500 transition-all" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Product Tables per Outlet */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Menu & Resep</CardTitle>
                            <CardDescription>Data produk dikelompokkan per outlet. Pilih tab untuk melihat menu masing-masing outlet.</CardDescription>
                        </div>
                        <ProductModal />
                    </div>
                </CardHeader>
                <CardContent>
                    {outletEntries.length > 0 ? (
                        <Tabs defaultValue={outletEntries[0]?.prefix} className="w-full">
                            <TabsList className="mb-4 flex-wrap h-auto gap-1">
                                {outletEntries.map(entry => (
                                    <TabsTrigger key={entry.prefix} value={entry.prefix} className="gap-1.5 text-xs sm:text-sm">
                                        <Store className="h-3.5 w-3.5" />
                                        {entry.name}
                                        <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5">{entry.items.length}</Badge>
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {outletEntries.map(entry => (
                                <TabsContent key={entry.prefix} value={entry.prefix}>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="min-w-[100px]">ID</TableHead>
                                                    <TableHead className="min-w-[200px]">Nama Menu</TableHead>
                                                    <TableHead className="min-w-[100px]">Kategori</TableHead>
                                                    <TableHead className="min-w-[300px]">Komposisi Resep</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {entry.items.map(m => {
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
                                </TabsContent>
                            ))}
                        </Tabs>
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

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { db } from "@/db"
import { masterMenu, inventoryState, masterBahan } from "@/db/schema"
import { Store, Package, AlertTriangle, ChevronRight } from "lucide-react"
import Link from "next/link"

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
        if (entry.menuNames.length < 3) {
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

            {/* Summary Cards */}
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

            {/* Outlet Card Grid */}
            {outlets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {outlets.map(o => (
                        <Link key={o.id} href={`/stores/${encodeURIComponent(o.id)}`}>
                            <Card className="group hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 cursor-pointer h-full">
                                <CardContent className="pt-6 flex flex-col gap-4 h-full">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-indigo-100 dark:bg-indigo-500/20 p-3 rounded-xl group-hover:bg-indigo-200 dark:group-hover:bg-indigo-500/30 transition-colors">
                                                <Store className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg leading-tight">{o.id}</p>
                                                <p className="text-xs text-slate-500">Outlet</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="text-xs">
                                            {o.menuCount} menu
                                        </Badge>
                                    </div>

                                    {/* Sample Menus */}
                                    <div className="flex flex-col gap-1.5 flex-1">
                                        {o.menuNames.map((name, i) => (
                                            <div key={i} className="text-xs text-slate-500 truncate bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-md">
                                                {name}
                                            </div>
                                        ))}
                                        {o.menuCount > 3 && (
                                            <div className="text-xs text-slate-400 px-2.5 py-1 italic">
                                                +{o.menuCount - 3} menu lainnya →
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-sm text-slate-500 flex h-48 items-center justify-center border rounded-md border-dashed">
                    Belum ada outlet. Data outlet otomatis muncul setelah sync Master Menu dari Settings.
                </div>
            )}
        </div>
    )
}

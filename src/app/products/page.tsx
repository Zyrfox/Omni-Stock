import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db } from "@/db"
import { masterMenu, mappingResep, masterBahan } from "@/db/schema"
import { Package, Utensils, Layers, ChevronRight, Refrigerator, ClipboardList } from "lucide-react"
import Link from "next/link"
import { resolveOutletName } from "@/lib/outlets"
import { LastSyncedBadge } from "@/components/ui/LastSyncedBadge"
import { auth } from "@/auth"

import { MasterBahanTable } from "@/components/products/MasterBahanTable"
import { MasterResepTable } from "@/components/products/MasterResepTable"
import { MasterMenuTable } from "@/components/products/MasterMenuTable"

interface ResepDetail {
    bahan_id: string;
    bahan_nama: string;
    jumlah_pakai: number;
    satuan: string;
    station: string | null;
    sub_total_cogs?: number;
}

export default async function ProductsPage() {
    const session = await auth();
    const isManager = session?.user?.role === "MANAGER";

    const menus = await db.select().from(masterMenu);
    const allResep = await db.select().from(mappingResep);
    const allBahan = await db.select().from(masterBahan);

    // Build bahan lookup & COGS Engine
    const bahanMap = new Map<string, typeof allBahan[0]>();
    const cogsMap = new Map<string, number>();

    for (const b of allBahan) {
        bahanMap.set(b.id, b);
        // Calculate harga_per_satuan (COGS basis)
        const hargaPerSatuan = (b.harga_satuan || 0) / (b.isi_kemasan || 1);
        cogsMap.set(b.id, hargaPerSatuan);
    }

    // Build resep per menu with Sub-Total COGS
    const resepPerMenu = new Map<string, ResepDetail[]>();
    for (const r of allResep) {
        const bahan = bahanMap.get(r.bahan_id);
        const unitCogs = cogsMap.get(r.bahan_id) || 0;
        const subTotalCogs = r.jumlah_pakai * unitCogs;

        if (!resepPerMenu.has(r.menu_id)) {
            resepPerMenu.set(r.menu_id, []);
        }
        resepPerMenu.get(r.menu_id)!.push({
            bahan_id: r.bahan_id,
            bahan_nama: bahan?.nama_bahan || r.bahan_id,
            jumlah_pakai: r.jumlah_pakai,
            satuan: r.satuan || bahan?.satuan_dasar || 'pcs',
            station: r.station,
            sub_total_cogs: subTotalCogs
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

    const outlets = new Set(outletEntries.map(e => e.prefix));

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Products & Recipes</h2>
                    <p className="text-slate-500 dark:text-slate-400">Pusat Data Logistik & Kalkulasi HPP (COGS) Absolute.</p>
                </div>
                <div className="flex flex-col md:items-end gap-1">
                    <LastSyncedBadge />
                    {!isManager && (
                        <span className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full ring-1 ring-rose-500/20">
                            READ-ONLY MODE (STAFF)
                        </span>
                    )}
                </div>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="transition-all duration-200 hover:shadow-lg border-l-4 border-l-cyan-500">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Master Bahan Baku</p>
                                <p className="text-3xl font-bold tracking-tight mt-1">{allBahan.length}</p>
                            </div>
                            <div className="bg-cyan-100 dark:bg-cyan-500/20 p-2.5 rounded-xl">
                                <Refrigerator className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="transition-all duration-200 hover:shadow-lg border-l-4 border-l-amber-500">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Bill of Materials (BOM)</p>
                                <p className="text-3xl font-bold tracking-tight mt-1">{allResep.length}</p>
                            </div>
                            <div className="bg-amber-100 dark:bg-amber-500/20 p-2.5 rounded-xl">
                                <ClipboardList className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="transition-all duration-200 hover:shadow-lg border-l-4 border-l-emerald-500">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Master Menu Final</p>
                                <p className="text-3xl font-bold tracking-tight mt-1">{menus.length}</p>
                            </div>
                            <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2.5 rounded-xl">
                                <Utensils className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* NATIVE SPA: 3 SLIDING TABS WITH ANIMATE PRESENCE IN CHILDREN COMPONENT */}
            <Card className="min-h-[600px] border-t-4 border-t-slate-800 dark:border-t-slate-200">
                <CardHeader className="pb-2">
                    <CardTitle>The Master Mirror Engine</CardTitle>
                    <CardDescription>Basis data Single Source of Truth tersinkronisasi atomik dengan Google Sheets.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="master_bahan" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 h-12 rounded-lg">
                            <TabsTrigger value="master_bahan" className="text-sm rounded-md transition-all data-[state=active]:bg-cyan-500 data-[state=active]:text-white font-medium">1. Master Bahan</TabsTrigger>
                            <TabsTrigger value="master_resep" className="text-sm rounded-md transition-all data-[state=active]:bg-amber-500 data-[state=active]:text-white font-medium">2. Master Resep</TabsTrigger>
                            <TabsTrigger value="master_menu" className="text-sm rounded-md transition-all data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-medium">3. Master Menu</TabsTrigger>
                        </TabsList>

                        <div className="overflow-hidden relative min-h-[400px]">
                            {/* Slide 1: Bahan */}
                            <TabsContent value="master_bahan" className="mt-0 outline-none animate-in slide-in-from-left-4 fade-in duration-300">
                                <MasterBahanTable bahan={allBahan} isManager={isManager} />
                            </TabsContent>

                            {/* Slide 2: Resep */}
                            <TabsContent value="master_resep" className="mt-0 outline-none animate-in fade-in zoom-in-95 duration-300">
                                <MasterResepTable menus={menus} resepPerMenu={resepPerMenu} isManager={isManager} />
                            </TabsContent>

                            {/* Slide 3: Menu */}
                            <TabsContent value="master_menu" className="mt-0 outline-none animate-in slide-in-from-right-4 fade-in duration-300">
                                <MasterMenuTable outletEntries={outletEntries} resepPerMenu={resepPerMenu} allBahan={allBahan} isManager={isManager} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

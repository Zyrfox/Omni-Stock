import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { db } from "@/db"
import { masterMenu, inventoryState, masterBahan, masterVendor, salesReports } from "@/db/schema"
import { eq, desc, like } from "drizzle-orm"
import { Store, ArrowLeft, Utensils, Package, AlertTriangle, Upload } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { OUTLET_MAP, resolveOutletName } from "@/lib/outlets"

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function StoreDetailPage({ params }: PageProps) {
    const { id } = await params;
    const outletSlug = decodeURIComponent(id);

    // Resolve slug to display name
    const outletName = OUTLET_MAP[outletSlug] || outletSlug.toUpperCase();

    try {
        // Get all menus that start with this prefix
        const allMenus = await db.select().from(masterMenu);
        const menus = allMenus.filter(m => m.id.split('_')[0] === outletSlug);

        if (menus.length === 0) {
            notFound();
        }

        // Get upload history for this outlet
        const allReports = await db
            .select()
            .from(salesReports)
            .orderBy(desc(salesReports.waktu_upload))
            .limit(50);

        // Filter uploads by outlet name in file_name
        const uploadHistory = allReports.filter(r =>
            r.file_name?.toLowerCase().includes(outletSlug) ||
            r.outlet_id === outletSlug ||
            r.file_name?.toLowerCase().includes(outletName.toLowerCase())
        ).slice(0, 10);

        // Get inventory + bahan + vendor data
        const allStock = await db.select().from(inventoryState);
        const allBahan = await db
            .select({
                id: masterBahan.id,
                nama_bahan: masterBahan.nama_bahan,
                satuan_dasar: masterBahan.satuan_dasar,
                batas_minimum: masterBahan.batas_minimum,
                vendor_id: masterBahan.vendor_id,
                vendor_nama: masterVendor.nama_vendor,
            })
            .from(masterBahan)
            .leftJoin(masterVendor, eq(masterBahan.vendor_id, masterVendor.id));

        // Enrich stock with bahan info
        const stockItems = allStock.map(s => {
            const bahan = allBahan.find(b => b.id === s.id_bahan);
            if (!bahan) return null;
            const isLow = s.current_stock <= bahan.batas_minimum;
            return {
                ...s,
                nama_bahan: bahan.nama_bahan,
                satuan_dasar: bahan.satuan_dasar,
                batas_minimum: bahan.batas_minimum,
                vendor_nama: bahan.vendor_nama,
                isLow,
            };
        }).filter(Boolean) as {
            id: string;
            id_bahan: string;
            current_stock: number;
            nama_bahan: string;
            satuan_dasar: string;
            batas_minimum: number;
            vendor_nama: string | null;
            isLow: boolean;
        }[];

        const lowStockItems = stockItems.filter(s => s.isLow);

        return (
            <div className="flex flex-col gap-6">
                {/* Back Button + Header */}
                <div>
                    <Link
                        href="/stores"
                        className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1.5 mb-3 w-fit transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Stores
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 dark:bg-indigo-500/20 p-3 rounded-xl">
                            <Store className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{outletName}</h2>
                            <p className="text-slate-500 dark:text-slate-400">Detail informasi outlet • <span className="font-mono">{outletSlug}</span></p>
                        </div>
                    </div>
                </div>

                {/* Summary KPI Cards */}
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
                                <div className="bg-blue-100 dark:bg-blue-500/20 p-2.5 rounded-xl">
                                    <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{uploadHistory.length}</p>
                                    <p className="text-xs text-slate-500">Total Upload</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className={`${lowStockItems.length > 0 ? 'bg-red-100 dark:bg-red-500/20' : 'bg-emerald-100 dark:bg-emerald-500/20'} p-2.5 rounded-xl`}>
                                    <AlertTriangle className={`h-5 w-5 ${lowStockItems.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{lowStockItems.length}</p>
                                    <p className="text-xs text-slate-500">Low Stock Items</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Menu List */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Utensils className="h-5 w-5" />
                                Daftar Menu ({menus.length})
                            </CardTitle>
                            <CardDescription>Semua menu yang tersedia di outlet ini.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-72 overflow-y-auto pr-2 space-y-1.5">
                                {menus.map(m => (
                                    <div
                                        key={m.id}
                                        className="text-sm px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between"
                                    >
                                        <span className="font-medium">{m.nama_menu}</span>
                                        <span className="font-mono text-xs text-slate-400">{m.id}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upload History */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="h-5 w-5" />
                                Upload History
                            </CardTitle>
                            <CardDescription>10 upload laporan terbaru untuk outlet ini.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {uploadHistory.length > 0 ? (
                                <div className="space-y-2">
                                    {uploadHistory.map(r => {
                                        const uploadDate = r.waktu_upload
                                            ? new Intl.DateTimeFormat('id-ID', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            }).format(new Date(r.waktu_upload))
                                            : '-';
                                        return (
                                            <div key={r.id} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                                <span className="font-medium truncate max-w-[200px]">{r.file_name}</span>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Badge
                                                        className={r.upload_status === 'parsed'
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-0'
                                                            : 'bg-red-100 text-red-700 border-0'}
                                                    >
                                                        {r.upload_status}
                                                    </Badge>
                                                    <span className="text-xs text-slate-400">{uploadDate}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-sm text-slate-500 flex h-24 items-center justify-center border rounded-md border-dashed">
                                    Belum ada upload untuk outlet ini.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Stock Status Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Status Inventori Bahan Baku
                        </CardTitle>
                        <CardDescription>
                            Stok bahan baku saat ini. Item dengan stok di bawah minimum akan ditandai merah.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stockItems.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="min-w-[180px]">Bahan Baku</TableHead>
                                            <TableHead className="text-right min-w-[100px]">Stok Saat Ini</TableHead>
                                            <TableHead className="text-right min-w-[100px]">Minimum</TableHead>
                                            <TableHead className="min-w-[140px]">Vendor</TableHead>
                                            <TableHead className="text-center min-w-[100px]">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stockItems
                                            .sort((a, b) => {
                                                const aRatio = a.current_stock / (a.batas_minimum || 1);
                                                const bRatio = b.current_stock / (b.batas_minimum || 1);
                                                return aRatio - bRatio;
                                            })
                                            .map((item) => (
                                                <TableRow key={item.id} className={item.isLow ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                                                    <TableCell className="font-medium">{item.nama_bahan}</TableCell>
                                                    <TableCell className={`text-right font-mono ${item.isLow ? 'text-red-600 font-bold' : ''}`}>
                                                        {item.current_stock.toFixed(2)} {item.satuan_dasar}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-slate-500">
                                                        {item.batas_minimum} {item.satuan_dasar}
                                                    </TableCell>
                                                    <TableCell className="text-slate-500 text-sm">{item.vendor_nama || '-'}</TableCell>
                                                    <TableCell className="text-center">
                                                        {item.isLow ? (
                                                            <Badge className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-0">
                                                                Low Stock
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-0">
                                                                Aman
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-sm text-slate-500 flex h-24 items-center justify-center border rounded-md border-dashed">
                                Belum ada data inventori.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        )
    } catch (error) {
        console.error("[StoreDetail] Error:", error);
        notFound();
    }
}

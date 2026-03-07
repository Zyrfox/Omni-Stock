import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import { Store } from "lucide-react";

interface MasterResepTableProps {
    menus: any[];
    resepPerMenu: Map<string, any[]>;
    isManager: boolean;
}

export function MasterResepTable({ menus, resepPerMenu, isManager }: MasterResepTableProps) {
    // Only show menus that actually have recipes mapping
    const menusWithRecipes = menus.filter(m => (resepPerMenu.get(m.id) || []).length > 0);

    return (
        <div className="w-full overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-semibold">Data Master Resep (BOM)</h3>
                    <p className="text-sm text-slate-500">Bill of Materials per Menu dengan kalkulasi Sub-Total COGS dinamis.</p>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px] whitespace-nowrap">ID Menu</TableHead>
                            <TableHead className="min-w-[200px] whitespace-nowrap">Nama Menu</TableHead>
                            <TableHead className="whitespace-nowrap">Outlet</TableHead>
                            <TableHead className="min-w-[400px]">Rincian Komposisi (Qty x Harga Satuan)</TableHead>
                            <TableHead className="text-right whitespace-nowrap text-amber-600 dark:text-amber-500 font-bold">Total COGS Resep</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {menusWithRecipes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                    Belum ada data mapping resep.
                                </TableCell>
                            </TableRow>
                        ) : (
                            menusWithRecipes.map((m) => {
                                const reseps = resepPerMenu.get(m.id) || [];

                                // Calculate total COGS for this specific menu
                                const totalCogs = reseps.reduce((sum, r) => sum + (r.sub_total_cogs || 0), 0);

                                return (
                                    <TableRow key={`resep-${m.id}`}>
                                        <TableCell className="font-mono text-xs text-slate-500">{m.id}</TableCell>
                                        <TableCell className="font-medium">{m.nama_menu}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="gap-1">
                                                <Store className="w-3 h-3" /> {m.outlet_id}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5 py-1">
                                                {reseps.map((r, i) => (
                                                    <div key={i} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded">
                                                        <span>{r.bahan_nama} <span className="text-slate-500">({r.jumlah_pakai} {r.satuan})</span></span>
                                                        <span className="font-mono text-slate-600 dark:text-slate-400">{formatRupiah(r.sub_total_cogs || 0)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-amber-600 dark:text-amber-500 bg-amber-50/50 dark:bg-amber-900/10">
                                            {formatRupiah(totalCogs)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import { ProductModal } from "@/components/products/ProductModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store } from "lucide-react";

interface MasterMenuTableProps {
    outletEntries: any[];
    resepPerMenu: Map<string, any[]>;
    allBahan: any[];
    isManager: boolean;
}

export function MasterMenuTable({ outletEntries, resepPerMenu, allBahan, isManager }: MasterMenuTableProps) {
    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-semibold">Data Master Menu</h3>
                    <p className="text-sm text-slate-500">Daftar produk jual akhir dikelompokkan per outlet.</p>
                </div>
                {isManager && <ProductModal allBahan={allBahan} />}
            </div>

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
                        <TabsContent key={entry.prefix} value={entry.prefix} className="mt-0">
                            <div className="w-full overflow-x-auto rounded-md border bg-card">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px] whitespace-nowrap">ID Menu</TableHead>
                                            <TableHead className="min-w-[200px] whitespace-nowrap">Nama Menu</TableHead>
                                            <TableHead className="min-w-[100px] whitespace-nowrap">Kategori</TableHead>
                                            <TableHead className="min-w-[250px] whitespace-nowrap">Recipe Overview</TableHead>
                                            <TableHead className="text-right whitespace-nowrap text-emerald-600 dark:text-emerald-500 font-bold">Total COGS</TableHead>
                                            {isManager && <TableHead className="w-[80px] text-right">Aksi</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {entry.items.map((m: any) => {
                                            const reseps = resepPerMenu.get(m.id) || [];
                                            const totalCogs = reseps.reduce((sum, r) => sum + (r.sub_total_cogs || 0), 0);

                                            return (
                                                <TableRow key={m.id}>
                                                    <TableCell className="font-mono text-xs text-slate-500 whitespace-nowrap">{m.id}</TableCell>
                                                    <TableCell className="font-medium whitespace-nowrap">{m.nama_menu}</TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        <Badge variant="outline">{m.kategori || m.outlet_id}</Badge>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        {reseps.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {reseps.map((r, i) => (
                                                                    <Badge key={i} variant="secondary" className="text-xs font-normal">
                                                                        {r.bahan_nama}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs italic">No Recipe Built</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10">
                                                        {formatRupiah(totalCogs)}
                                                    </TableCell>
                                                    {isManager && (
                                                        <TableCell className="text-right">
                                                            <ProductModal
                                                                editData={{
                                                                    id: m.id,
                                                                    nama_menu: m.nama_menu,
                                                                    kategori: m.kategori || "Food",
                                                                    outlet_id: m.outlet_id,
                                                                    resep: reseps.map(r => ({
                                                                        bahan_id: r.bahan_id,
                                                                        jumlah_pakai: r.jumlah_pakai,
                                                                        satuan: r.satuan
                                                                    }))
                                                                }}
                                                                allBahan={allBahan}
                                                                triggerElement={
                                                                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-500 transition-colors">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                                                                    </button>
                                                                }
                                                            />
                                                        </TableCell>
                                                    )}
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
                    Belum ada data menu untuk outlet ini.
                </div>
            )}
        </div>
    );
}

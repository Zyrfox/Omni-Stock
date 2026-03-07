import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import { BahanModal } from "@/components/products/BahanModal";

interface MasterBahanTableProps {
    bahan: any[];
    isManager: boolean;
}

export function MasterBahanTable({ bahan, isManager }: MasterBahanTableProps) {
    return (
        <div className="w-full overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-semibold">Data Master Bahan Baku</h3>
                    <p className="text-sm text-slate-500">Harga Per Satuan terkalkulasi otomatis secara real-time dari (Harga / Isi Kemasan).</p>
                </div>
                {isManager && <BahanModal />}
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px] whitespace-nowrap">ID Bahan</TableHead>
                            <TableHead className="min-w-[200px] whitespace-nowrap">Nama Bahan</TableHead>
                            <TableHead className="whitespace-nowrap">Satuan (Saji / Dasar)</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Harga Beli Kemasan</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Isi (Yield) Kemasan</TableHead>
                            <TableHead className="text-right whitespace-nowrap text-blue-600 dark:text-blue-400 font-bold">Harga Per Satuan (COGS)</TableHead>
                            {isManager && <TableHead className="w-[80px] text-right">Aksi</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bahan.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={isManager ? 7 : 6} className="h-24 text-center text-slate-500">
                                    Belum ada data bahan.
                                </TableCell>
                            </TableRow>
                        ) : (
                            bahan.map((b) => {
                                // COGS Engine: harga_per_satuan
                                const hargaPerSatuan = (b.harga_satuan || 0) / (b.isi_kemasan || 1);

                                return (
                                    <TableRow key={b.id}>
                                        <TableCell className="font-mono text-xs text-slate-500">{b.id}</TableCell>
                                        <TableCell className="font-medium">{b.nama_bahan}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{b.satuan_dasar}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{formatRupiah(b.harga_satuan || 0)} <span className="text-[10px] text-slate-400">/{b.kemasan_beli}</span></TableCell>
                                        <TableCell className="text-right">{b.isi_kemasan}</TableCell>
                                        <TableCell className="text-right font-medium text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
                                            {formatRupiah(hargaPerSatuan)}
                                        </TableCell>
                                        {isManager && (
                                            <TableCell className="text-right">
                                                <BahanModal
                                                    triggerElement={
                                                        <button className="text-slate-400 hover:text-slate-600 p-2">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                                                        </button>
                                                    }
                                                    editData={{
                                                        id: b.id,
                                                        nama_bahan: b.nama_bahan,
                                                        satuan_dasar: b.satuan_dasar,
                                                        batas_minimum: b.batas_minimum,
                                                        harga_satuan: b.harga_satuan,
                                                        kemasan_beli: b.kemasan_beli,
                                                        isi_kemasan: b.isi_kemasan
                                                    }}
                                                />
                                            </TableCell>
                                        )}
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

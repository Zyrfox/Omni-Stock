"use client";

import { useEffect, useState } from "react";
import { Search, Filter, ChevronLeft, ChevronRight, X, AlertTriangle, ShoppingCart, Check, Trash2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { usePOBuilder } from "@/lib/store/usePOBuilder";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ITEMS_PER_PAGE = 10;

interface SmartStockItem {
    id_bahan: string;
    nama_bahan: string;
    satuan: string;
    current_stock: number;
    batas_minimum: number;
    vendor_nama: string;
    vendor_id: string;
    stock_status: string;
    needs_restock: boolean;
    suggested_order_qty?: number;
    harga_satuan: number;
    kontak_wa?: string;
    info_pembayaran?: string;
}

export function ProductTable() {
    const [searchTerm, setSearchTerm] = useState("");
    const [products, setProducts] = useState<SmartStockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [draftPOProduct, setDraftPOProduct] = useState<SmartStockItem | null>(null);
    const [draftQty, setDraftQty] = useState("");

    const { addPO, approvedPOs, removePO } = usePOBuilder();

    async function fetchProducts() {
        try {
            const res = await fetch("/api/inventory/po-workbench");
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (error) {
            console.error("Failed to fetch product inventory", error);
        } finally {
            setLoading(false);
        }
    }

    const handleClearInventory = async () => {
        setProducts([]);
        toast.success("Tampilan tabel berhasil dibersihkan.", {
            description: "Peringatan: Data di database tidak terhapus."
        });
    };

    useEffect(() => { fetchProducts(); }, []);

    const handleRancangClick = (product: SmartStockItem) => {
        setDraftPOProduct(product);
        const qtyToOrder = product.current_stock < product.batas_minimum
            ? (product.batas_minimum - product.current_stock)
            : 0;
        setDraftQty(String(qtyToOrder > 0 ? qtyToOrder : 10));
    };

    const handleApprovePO = () => {
        if (!draftPOProduct) return;

        addPO({
            id_bahan: draftPOProduct.id_bahan,
            nama_bahan: draftPOProduct.nama_bahan,
            qty: parseFloat(draftQty) || 1,
            harga_satuan: draftPOProduct.harga_satuan,
            vendor_id: draftPOProduct.vendor_id,
            vendor_nama: draftPOProduct.vendor_nama,
            info_pembayaran: draftPOProduct.info_pembayaran || null
        });

        toast.success("Dimasukkan ke Invoice", { description: `${draftPOProduct.nama_bahan} sejumlah ${draftQty} ${draftPOProduct.satuan}` });
        setDraftPOProduct(null);
    };

    const filteredProducts = products.filter(p =>
        p.nama_bahan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id_bahan.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const statusBadge = (status: string) => {
        const styles: Record<string, string> = {
            sufficient: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            warning: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
            low: "bg-amber-500/10 text-amber-500 border-amber-500/20",
            out: "bg-destructive/10 text-destructive border-destructive/20",
        };
        const labels: Record<string, string> = {
            sufficient: "Aman", warning: "Perlu Pantau", low: "Menipis", out: "Habis"
        };
        return <Badge variant="outline" className={styles[status] || ""}>{labels[status] || status}</Badge>;
    };

    // Summary counts
    const totalItems = products.length;
    const needsRestockCount = products.filter(p => p.needs_restock).length;

    return (
        <>
            <Card className="border-white/10 dark:border-white/5">
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4">
                    <div>
                        <CardTitle className="text-lg">Product Inventory</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            {totalItems} item · <span className="text-amber-500 font-medium">{needsRestockCount} perlu restock</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto mt-3 sm:mt-0 flex-wrap">
                        <div className="relative flex-1 sm:w-64 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Cari bahan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-secondary/50 rounded-lg" />
                        </div>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="rounded-lg gap-2 text-xs sm:text-sm">
                                    <Trash2 className="h-4 w-4" /> <span className="hidden sm:inline">Kosongkan Data</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                        <AlertCircle className="h-5 w-5" /> Konfirmasi Hapus Inventori
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Tindakan ini akan menghapus <strong>seluruh data stok dari Kartu Stok terakhir</strong> berikut histori sinkronisasinya. Anda harus mengupload ulang Kartu Stok baru dari Pawoon.
                                        <br /><br />
                                        Lanjutkan?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleClearInventory} className="bg-destructive hover:bg-destructive/90 text-white">
                                        Ya, Kosongkan
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                    </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6 sm:pt-0">
                    <div className="w-full overflow-x-auto rounded-md border border-border">
                        <Table>
                            <TableHeader className="bg-secondary/30">
                                <TableRow>
                                    <TableHead className="w-[40px] whitespace-nowrap">#</TableHead>
                                    <TableHead className="whitespace-nowrap">ID Bahan</TableHead>
                                    <TableHead className="whitespace-nowrap">Nama Bahan</TableHead>
                                    <TableHead className="text-right whitespace-nowrap">Stok Saat Ini</TableHead>
                                    <TableHead className="text-right whitespace-nowrap">Min. Stok</TableHead>
                                    <TableHead className="whitespace-nowrap">Status</TableHead>
                                    <TableHead className="whitespace-nowrap">Vendor</TableHead>
                                    <TableHead className="text-right whitespace-nowrap">Harga/Qty</TableHead>
                                    <TableHead className="w-[120px] text-center whitespace-nowrap">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={9} className="h-24 text-center text-muted-foreground">Memuat data stok...</TableCell></TableRow>
                                ) : paginatedProducts.length === 0 ? (
                                    <TableRow><TableCell colSpan={9} className="h-24 text-center text-muted-foreground">Tidak ada data.</TableCell></TableRow>
                                ) : (
                                    paginatedProducts.map((p, index) => (
                                        <TableRow key={`${p.id_bahan}-${startIndex + index}`} className="hover:bg-secondary/20 transition-colors">
                                            <TableCell className="text-muted-foreground whitespace-nowrap">{startIndex + index + 1}</TableCell>
                                            <TableCell className="font-mono text-xs whitespace-nowrap">{p.id_bahan}</TableCell>
                                            <TableCell className="font-medium whitespace-nowrap">{p.nama_bahan}</TableCell>
                                            <TableCell className={`text-right font-bold whitespace-nowrap ${p.stock_status === 'out' ? 'text-destructive' : p.stock_status === 'low' ? 'text-amber-500' : ''}`}>
                                                {p.current_stock.toFixed(2)} <span className="text-xs text-muted-foreground font-normal">{p.satuan}</span>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground whitespace-nowrap">{p.batas_minimum.toFixed(0)}</TableCell>
                                            <TableCell className="whitespace-nowrap">{statusBadge(p.stock_status)}</TableCell>
                                            <TableCell className="text-sm whitespace-nowrap pt-3 pb-3">
                                                {p.kontak_wa ? (
                                                    <a href={`https://wa.me/62${p.kontak_wa?.replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                                        {p.vendor_nama}
                                                    </a>
                                                ) : (
                                                    <span>{p.vendor_nama}</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right whitespace-nowrap text-sm text-muted-foreground">
                                                Rp {(p.harga_satuan || 0).toLocaleString('id-ID')}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-1">
                                                    {approvedPOs.some(po => po.id_bahan === p.id_bahan) ? (
                                                        <Button variant="outline" size="sm" className="h-8 gap-1 border-emerald-500/50 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20" onClick={() => removePO(p.id_bahan)} title="Batal PO">
                                                            <Check className="h-3.5 w-3.5" />
                                                            <span>Drafted</span>
                                                        </Button>
                                                    ) : (
                                                        <Button variant="outline" size="sm" className="h-8 gap-1 hover:bg-lime-500 hover:text-black hover:border-lime-500" onClick={() => handleRancangClick(p)} title="Rancang PO">
                                                            <ShoppingCart className="h-3.5 w-3.5" />
                                                            <span>PO</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {!loading && filteredProducts.length > ITEMS_PER_PAGE && (
                        <div className="flex items-center justify-between pt-4 px-2">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filteredProducts.length)} dari {filteredProducts.length} item
                            </p>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 w-8 p-0">
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    let pageNum: number;
                                    if (totalPages <= 5) pageNum = i + 1;
                                    else if (currentPage <= 3) pageNum = i + 1;
                                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = currentPage - 2 + i;
                                    return (
                                        <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(pageNum)} className="h-8 w-8 p-0 text-xs">
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 w-8 p-0">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card >

            {/* RANCANG PO MODAL */}
            {
                draftPOProduct && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 min-h-[100dvh]" onClick={() => setDraftPOProduct(null)}>
                        <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5 text-lime-500" />
                                    Rancang PO Vendor
                                </h3>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDraftPOProduct(null)}><X className="h-4 w-4" /></Button>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-secondary/30 p-3 rounded-lg border border-border/50 text-sm">
                                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                                        <span>Bahan:</span>
                                        <span className="font-semibold text-foreground text-right">{draftPOProduct!.nama_bahan}</span>
                                        <span>Vendor:</span>
                                        <span className="font-semibold text-foreground text-right">{draftPOProduct!.vendor_nama}</span>
                                        <span>Stok vs Min:</span>
                                        <span className="font-semibold text-foreground text-right">{draftPOProduct!.current_stock.toFixed(1)} / {draftPOProduct!.batas_minimum}</span>
                                        <span>Harga/Qty:</span>
                                        <span className="font-semibold text-foreground text-right">Rp {(draftPOProduct!.harga_satuan || 0).toLocaleString('id-ID')}</span>
                                    </div>
                                </div>

                                <div className="grid gap-3">
                                    <div>
                                        <label className="text-sm font-semibold block mb-1">Qty Order ({draftPOProduct!.satuan})</label>
                                        <Input type="number" value={draftQty} onChange={e => setDraftQty(e.target.value)} step="0.01" className="bg-secondary/50 text-lg py-6" autoFocus />
                                    </div>
                                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                                        <label className="text-xs text-amber-600 dark:text-amber-500 font-semibold uppercase tracking-wider block mb-1">Total Biaya (Estimasi)</label>
                                        <p className="font-mono text-xl text-foreground font-bold">
                                            Rp {((parseFloat(draftQty) || 0) * (draftPOProduct!.harga_satuan || 0)).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    {draftPOProduct!.info_pembayaran && (
                                        <div className="bg-muted p-3 rounded-lg mt-2">
                                            <label className="text-xs text-muted-foreground mb-1 block">Info Pembayaran Vendor:</label>
                                            <p className="text-sm font-medium">{draftPOProduct!.info_pembayaran}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" className="flex-1" onClick={() => setDraftPOProduct(null)}>Batal</Button>
                                <Button className="flex-1 gap-2 bg-lime-500 text-black hover:bg-lime-600" onClick={handleApprovePO}>
                                    <Check className="h-4 w-4" /> Approve & Masuk Invoice
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
}

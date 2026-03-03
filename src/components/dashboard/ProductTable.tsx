"use client";

import { useEffect, useState } from "react";
import { Search, Edit, Trash2, Filter, ChevronLeft, ChevronRight, X, Save, AlertTriangle, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;

interface SmartStockItem {
    id_bahan: string;
    nama_bahan: string;
    satuan: string;
    current_stock: number;
    batas_minimum: number;
    vendor_nama: string;
    stock_status: string;
    needs_restock: boolean;
    suggested_order_qty: number;
}

export function ProductTable() {
    const [searchTerm, setSearchTerm] = useState("");
    const [products, setProducts] = useState<SmartStockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [editingProduct, setEditingProduct] = useState<SmartStockItem | null>(null);
    const [editStock, setEditStock] = useState("");
    const [deletingProduct, setDeletingProduct] = useState<SmartStockItem | null>(null);

    async function fetchProducts() {
        try {
            const res = await fetch("/api/inventory/smart-stock");
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

    useEffect(() => { fetchProducts(); }, []);

    const handleEditClick = (product: SmartStockItem) => {
        setEditingProduct(product);
        setEditStock(String(product.current_stock));
    };

    const handleEditSave = async () => {
        if (!editingProduct) return;
        try {
            const res = await fetch("/api/inventory/manage", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_bahan: editingProduct.id_bahan, current_stock: parseFloat(editStock) }),
            });
            if (res.ok) {
                toast.success("Stok Diperbarui", { description: `${editingProduct.nama_bahan} → ${editStock}` });
                setEditingProduct(null);
                await fetchProducts();
            } else {
                toast.error("Gagal memperbarui stok");
            }
        } catch { toast.error("Terjadi kesalahan"); }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingProduct) return;
        try {
            const res = await fetch(`/api/inventory/manage?id_bahan=${encodeURIComponent(deletingProduct.id_bahan)}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Item Dihapus", { description: `${deletingProduct.nama_bahan} dihapus.` });
                setDeletingProduct(null);
                await fetchProducts();
            } else { toast.error("Gagal menghapus"); }
        } catch { toast.error("Terjadi kesalahan"); }
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
                    <div className="flex items-center gap-3 w-full sm:w-auto mt-3 sm:mt-0">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Cari bahan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-secondary/50 rounded-lg" />
                        </div>
                        <Button variant="outline" className="border-border rounded-lg" size="icon">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6 sm:pt-0">
                    <div className="rounded-md border border-border overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-secondary/30">
                                <TableRow>
                                    <TableHead className="w-[40px]">#</TableHead>
                                    <TableHead>ID Bahan</TableHead>
                                    <TableHead>Nama Bahan</TableHead>
                                    <TableHead className="text-right">Stok Saat Ini</TableHead>
                                    <TableHead className="text-right">Min. Stok</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Vendor</TableHead>
                                    <TableHead className="text-right">Prediksi PO</TableHead>
                                    <TableHead className="w-[90px] text-center">Aksi</TableHead>
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
                                            <TableCell className="text-muted-foreground">{startIndex + index + 1}</TableCell>
                                            <TableCell className="font-mono text-xs">{p.id_bahan}</TableCell>
                                            <TableCell className="font-medium">{p.nama_bahan}</TableCell>
                                            <TableCell className={`text-right font-bold ${p.stock_status === 'out' ? 'text-destructive' : p.stock_status === 'low' ? 'text-amber-500' : ''}`}>
                                                {p.current_stock.toFixed(2)} <span className="text-xs text-muted-foreground font-normal">{p.satuan}</span>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">{p.batas_minimum.toFixed(0)}</TableCell>
                                            <TableCell>{statusBadge(p.stock_status)}</TableCell>
                                            <TableCell className="text-sm">{p.vendor_nama}</TableCell>
                                            <TableCell className="text-right">
                                                {p.needs_restock ? (
                                                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-sm">
                                                        <ShoppingCart className="h-3.5 w-3.5" />
                                                        {p.suggested_order_qty} {p.satuan}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-500" onClick={() => handleEditClick(p)} title="Edit Stok">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeletingProduct(p)} title="Hapus">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
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
            </Card>

            {/* EDIT MODAL */}
            {editingProduct && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingProduct(null)}>
                    <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Edit Stok Bahan</h3>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingProduct(null)}><X className="h-4 w-4" /></Button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm text-muted-foreground">ID Bahan</label>
                                <p className="font-mono text-sm font-medium">{editingProduct.id_bahan}</p>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">Nama</label>
                                <p className="font-medium">{editingProduct.nama_bahan}</p>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground block mb-1">Jumlah Stok ({editingProduct.satuan})</label>
                                <Input type="number" value={editStock} onChange={e => setEditStock(e.target.value)} step="0.01" className="bg-secondary/50" autoFocus />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" className="flex-1" onClick={() => setEditingProduct(null)}>Batal</Button>
                            <Button className="flex-1 gap-2" onClick={handleEditSave}><Save className="h-4 w-4" />Simpan</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {deletingProduct && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeletingProduct(null)}>
                    <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-5" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center"><AlertTriangle className="h-6 w-6 text-destructive" /></div>
                            <h3 className="text-lg font-semibold">Hapus Item?</h3>
                            <p className="text-sm text-muted-foreground">Yakin ingin menghapus <span className="font-semibold text-foreground">{deletingProduct.nama_bahan}</span>?</p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setDeletingProduct(null)}>Batal</Button>
                            <Button variant="destructive" className="flex-1 gap-2" onClick={handleDeleteConfirm}><Trash2 className="h-4 w-4" />Hapus</Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Trash2, Store } from "lucide-react";
import { toast } from "sonner";
import { OUTLETS, DEFAULT_CATEGORIES, type Outlet } from "@/lib/outlets";

export function ProductModal() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [outlets, setOutlets] = useState<Outlet[]>(OUTLETS);
    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [generatedId, setGeneratedId] = useState("");

    // Category: either from dropdown or typed custom
    const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
    const [selectedCategory, setSelectedCategory] = useState("Food");
    const [customCategory, setCustomCategory] = useState("");
    const [isCustomCategory, setIsCustomCategory] = useState(false);

    const [formData, setFormData] = useState({ nama_menu: "" });
    const [resepList, setResepList] = useState([{ bahan_id: "", jumlah_pakai: "", satuan: "pcs" }]);

    // Add Outlet state
    const [showAddOutlet, setShowAddOutlet] = useState(false);
    const [newOutletName, setNewOutletName] = useState("");
    const [newOutletPrefix, setNewOutletPrefix] = useState("");

    // Effective category value
    const effectiveCategory = isCustomCategory ? customCategory : selectedCategory;

    // Auto-generate ID when outlet or category changes
    useEffect(() => {
        if (!selectedOutlet || !effectiveCategory.trim()) {
            setGeneratedId("");
            return;
        }
        async function fetchAndGenerate() {
            try {
                const res = await fetch(`/api/products/next-id?prefix=${selectedOutlet}&category=${encodeURIComponent(effectiveCategory)}`);
                if (res.ok) {
                    const data = await res.json();
                    setGeneratedId(data.nextId);
                }
            } catch {
                setGeneratedId(`${selectedOutlet}_xx_001`);
            }
        }
        fetchAndGenerate();
    }, [selectedOutlet, effectiveCategory]);

    // Auto-generate prefix from outlet name
    function generatePrefix(name: string): string {
        return name
            .split(/\s+/)
            .map(w => w[0]?.toLowerCase() || '')
            .join('')
            .slice(0, 4);
    }

    const handleAddOutlet = () => {
        if (!newOutletName.trim() || !newOutletPrefix.trim()) return;
        const newOutlet: Outlet = { id: newOutletPrefix.toLowerCase(), name: newOutletName };
        setOutlets(prev => [...prev, newOutlet]);
        setSelectedOutlet(newOutlet.id);
        setShowAddOutlet(false);
        setNewOutletName("");
        setNewOutletPrefix("");
        toast.success(`Outlet "${newOutletName}" ditambahkan!`);
    };

    const handleCategorySelect = (val: string) => {
        if (val === '__custom__') {
            setIsCustomCategory(true);
            setCustomCategory("");
        } else {
            setIsCustomCategory(false);
            setSelectedCategory(val);
        }
    };

    const handleAddResep = () => {
        setResepList([...resepList, { bahan_id: "", jumlah_pakai: "", satuan: "pcs" }]);
    };

    const handleRemoveResep = (index: number) => {
        const newList = [...resepList];
        newList.splice(index, 1);
        setResepList(newList);
    };

    const handleResepChange = (index: number, field: string, value: string) => {
        const newList = [...resepList];
        (newList[index] as any)[field] = value;
        setResepList(newList);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOutlet) {
            toast.error("Pilih outlet terlebih dahulu");
            return;
        }
        if (!effectiveCategory.trim()) {
            toast.error("Pilih atau ketik kategori");
            return;
        }
        setLoading(true);

        // If custom category, add it to the list for next time
        if (isCustomCategory && customCategory.trim() && !categories.includes(customCategory.trim())) {
            setCategories(prev => [...prev, customCategory.trim()]);
        }

        try {
            const res = await fetch("/api/products/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    menu: {
                        id: generatedId,
                        nama_menu: formData.nama_menu,
                        outlet_id: selectedOutlet,
                        outlet_name: outlets.find(o => o.id === selectedOutlet)?.name || selectedOutlet,
                        kategori: effectiveCategory,
                    },
                    resep: resepList.filter(r => r.bahan_id.trim() !== '')
                })
            });

            if (!res.ok) throw new Error("Gagal menyimpan ke Google Sheets");

            toast.success(`Produk "${formData.nama_menu}" (${generatedId}) berhasil disimpan!`);
            setOpen(false);

            // Reset
            setFormData({ nama_menu: "" });
            setSelectedOutlet("");
            setGeneratedId("");
            setSelectedCategory("Food");
            setIsCustomCategory(false);
            setCustomCategory("");
            setResepList([{ bahan_id: "", jumlah_pakai: "", satuan: "pcs" }]);

            window.location.reload();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Terjadi kesalahan sistem");
        } finally {
            setLoading(false);
        }
    };

    const outletDisplayName = outlets.find(o => o.id === selectedOutlet)?.name || "";

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Tambah Produk
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[540px] bg-card text-foreground max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Tambah Produk Baru (GSheets Sync)</DialogTitle>
                    <DialogDescription>
                        ID produk di-generate otomatis dari Outlet + Kategori yang dipilih.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {/* Outlet Select */}
                    <div className="space-y-2">
                        <Label>Outlet</Label>
                        <div className="flex gap-2">
                            <Select value={selectedOutlet} onValueChange={setSelectedOutlet}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Pilih outlet..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {outlets.map(o => (
                                        <SelectItem key={o.id} value={o.id}>
                                            <span className="flex items-center gap-2">
                                                <Store className="h-3.5 w-3.5 text-muted-foreground" />
                                                {o.name} <span className="text-muted-foreground text-xs">({o.id})</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setShowAddOutlet(!showAddOutlet)}
                                title="Tambah Outlet Baru"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Add Outlet inline form */}
                    {showAddOutlet && (
                        <div className="p-3 border border-dashed border-lime-500/50 rounded-lg space-y-2 bg-lime-500/5">
                            <Label className="text-xs font-semibold text-lime-600 dark:text-lime-400">Tambah Outlet Baru</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Nama Outlet (cth: Warung Sate)"
                                    value={newOutletName}
                                    onChange={(e) => {
                                        setNewOutletName(e.target.value);
                                        setNewOutletPrefix(generatePrefix(e.target.value));
                                    }}
                                    className="flex-1"
                                />
                                <Input
                                    placeholder="Prefix"
                                    value={newOutletPrefix}
                                    onChange={(e) => setNewOutletPrefix(e.target.value)}
                                    className="w-20"
                                />
                                <Button type="button" size="sm" onClick={handleAddOutlet} className="h-9">
                                    Add
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Category (Creatable Select) */}
                    <div className="space-y-2">
                        <Label>Kategori</Label>
                        {isCustomCategory ? (
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Ketik kategori baru (cth: Snack, Merchandise)"
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                    className="flex-1"
                                    autoFocus
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-9 text-xs"
                                    onClick={() => {
                                        setIsCustomCategory(false);
                                        setSelectedCategory("Food");
                                    }}
                                >
                                    Batal
                                </Button>
                            </div>
                        ) : (
                            <Select value={selectedCategory} onValueChange={handleCategorySelect}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                    <SelectItem value="__custom__">
                                        <span className="flex items-center gap-1.5 text-lime-600 dark:text-lime-400">
                                            <Plus className="h-3.5 w-3.5" /> Kategori Baru...
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Auto-generated ID Preview */}
                    {generatedId && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border">
                            <span className="text-xs text-muted-foreground">ID Otomatis:</span>
                            <code className="text-sm font-mono font-bold text-lime-600 dark:text-lime-400">{generatedId}</code>
                            <span className="text-xs text-muted-foreground ml-auto">{outletDisplayName} • {effectiveCategory}</span>
                        </div>
                    )}

                    {/* Menu Name */}
                    <div className="space-y-2">
                        <Label htmlFor="nama_menu">Nama Menu/Produk</Label>
                        <Input
                            id="nama_menu"
                            placeholder="Cth: Nasi Goreng Spesial"
                            required
                            value={formData.nama_menu}
                            onChange={(e) => setFormData({ ...formData, nama_menu: e.target.value })}
                        />
                    </div>

                    {/* Resep / Komposisi */}
                    <div className="pt-4 border-t border-border mt-4">
                        <div className="flex justify-between items-center mb-3">
                            <Label className="font-semibold">Resep / Komposisi</Label>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddResep} className="h-7 text-xs">
                                <Plus className="h-3 w-3 mr-1" /> Add
                            </Button>
                        </div>
                        <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                            {resepList.map((resep, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input
                                        className="flex-1"
                                        placeholder="ID Bahan (cth: bhn_raw_1)"
                                        value={resep.bahan_id}
                                        onChange={(e) => handleResepChange(index, "bahan_id", e.target.value)}
                                    />
                                    <Input
                                        className="w-20"
                                        placeholder="Qty"
                                        type="number"
                                        step="0.01"
                                        value={resep.jumlah_pakai}
                                        onChange={(e) => handleResepChange(index, "jumlah_pakai", e.target.value)}
                                    />
                                    <Input
                                        className="w-16"
                                        placeholder="Unit"
                                        value={resep.satuan}
                                        onChange={(e) => handleResepChange(index, "satuan", e.target.value)}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-destructive shrink-0"
                                        onClick={() => handleRemoveResep(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {resepList.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-2">Belum ada komposisi, tambah bahan sekarang.</p>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2 border-t border-border">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={loading || !selectedOutlet || !effectiveCategory.trim()}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan ke GSheets
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

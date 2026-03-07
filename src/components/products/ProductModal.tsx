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
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Sparkles, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";

const formSchema = z.object({
    nama_menu: z.string().min(2, "Nama menu minimal 2 karakter"),
    outlet_id: z.string().min(1, "Outlet wajib dipilih"),
    kategori: z.string().min(1, "Kategori wajib diisi"),
    resep: z.array(z.object({
        bahan_id: z.string().min(1, "Bahan ID / Nama Bahan wajib diisi"),
        jumlah_pakai: z.number().min(0.01, "Qty harus lebih dari 0"),
        satuan: z.string().min(1, "Satuan wajib diisi"),
    }))
});

type FormValues = z.infer<typeof formSchema>;

interface ProductModalProps {
    editData?: Partial<FormValues> & { id?: string };
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    triggerElement?: React.ReactNode;
    allBahan?: Array<{ id: string; nama_bahan: string; satuan_dasar: string }>;
}

export function ProductModal({ editData, isOpen, onOpenChange, triggerElement, allBahan = [] }: ProductModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    // Controlled vs Uncontrolled logic
    const open = isOpen !== undefined ? isOpen : internalOpen;
    const setOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;

    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [outlets, setOutlets] = useState<Outlet[]>(OUTLETS);
    const [generatedId, setGeneratedId] = useState(editData?.id || "");
    const [aiMatchedIndexes, setAiMatchedIndexes] = useState<number[]>([]);

    // Combobox exact state array
    const [openComboboxes, setOpenComboboxes] = useState<{ [key: number]: boolean }>({});

    // Category states for the custom dropdown logic
    const initialIsCustom = editData && editData.kategori ? !DEFAULT_CATEGORIES.includes(editData.kategori) : false;
    const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
    const [isCustomCategory, setIsCustomCategory] = useState(initialIsCustom);
    const [customCategory, setCustomCategory] = useState(initialIsCustom ? editData!.kategori! : "");

    // Add Outlet state
    const [showAddOutlet, setShowAddOutlet] = useState(false);
    const [newOutletName, setNewOutletName] = useState("");
    const [newOutletPrefix, setNewOutletPrefix] = useState("");

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nama_menu: editData?.nama_menu || "",
            outlet_id: editData?.outlet_id || "",
            kategori: editData?.kategori || "Food",
            resep: editData?.resep?.length ? editData.resep : [{ bahan_id: "", jumlah_pakai: 1, satuan: "pcs" }]
        }
    });

    const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = form;

    // Reset when editData changes or modal opens
    useEffect(() => {
        if (open) {
            if (editData) {
                reset({
                    nama_menu: editData.nama_menu || "",
                    outlet_id: editData.outlet_id || "",
                    kategori: editData.kategori || "Food",
                    resep: editData.resep?.length ? editData.resep : [{ bahan_id: "", jumlah_pakai: 1, satuan: "pcs" }]
                });
                setGeneratedId(editData.id || "");
                if (editData.kategori && !DEFAULT_CATEGORIES.includes(editData.kategori)) {
                    setIsCustomCategory(true);
                    setCustomCategory(editData.kategori);
                    if (!categories.includes(editData.kategori)) {
                        setCategories(prev => [...prev, editData.kategori!]);
                    }
                } else {
                    setIsCustomCategory(false);
                    setCustomCategory("");
                }
            } else {
                reset({
                    nama_menu: "",
                    outlet_id: "",
                    kategori: "Food",
                    resep: [{ bahan_id: "", jumlah_pakai: 1, satuan: "pcs" }]
                });
                setGeneratedId("");
                setIsCustomCategory(false);
                setCustomCategory("");
            }
        }
    }, [open, editData, reset]);

    const { fields, append, remove } = useFieldArray({
        name: "resep",
        control
    });

    const watchOutlet = watch("outlet_id");
    const watchKategori = watch("kategori");

    const effectiveCategory = isCustomCategory ? customCategory : watchKategori;

    useEffect(() => {
        // [Hotfix PRD 6.10] Don't aggressively overwrite generatedId if we're editing an existing menu
        if (editData?.id) {
            setGeneratedId(editData.id);
            return;
        }

        if (!watchOutlet || !effectiveCategory.trim()) {
            setGeneratedId("");
            return;
        }
        async function fetchAndGenerate() {
            try {
                const res = await fetch(`/api/products/next-id?prefix=${watchOutlet}&category=${encodeURIComponent(effectiveCategory)}`);
                if (res.ok) {
                    const data = await res.json();
                    setGeneratedId(data.nextId);
                }
            } catch {
                setGeneratedId(`${watchOutlet}_xx_001`);
            }
        }
        fetchAndGenerate();
    }, [watchOutlet, effectiveCategory, editData?.id]);

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
        setValue("outlet_id", newOutlet.id);
        setShowAddOutlet(false);
        setNewOutletName("");
        setNewOutletPrefix("");
        toast.success(`Outlet "${newOutletName}" ditambahkan!`);
    };

    const handleCategorySelect = (val: string) => {
        if (val === '__custom__') {
            setIsCustomCategory(true);
            setCustomCategory("");
            setValue("kategori", "");
        } else {
            setIsCustomCategory(false);
            setValue("kategori", val);
        }
    };

    const onSubmit = async (data: FormValues) => {
        const finalCategory = isCustomCategory ? customCategory : data.kategori;
        if (!finalCategory.trim()) {
            toast.error("Pilih atau ketik kategori");
            return;
        }

        // Validate Free-text ingredients
        if (allBahan.length > 0 && data.resep && data.resep.length > 0) {
            const hasInvalidIngredient = data.resep.some(r =>
                !r.bahan_id.startsWith('bhn_') && !allBahan.some(b => b.id === r.bahan_id)
            );
            if (hasInvalidIngredient) {
                toast.error("Terdapat teks bebas di Komposisi Resep! Klik tombol 'AI Auto-Match ✨' terlebih dahulu.", {
                    duration: 5000,
                });
                return;
            }
        }

        setLoading(true);

        if (isCustomCategory && customCategory.trim() && !categories.includes(customCategory.trim())) {
            setCategories(prev => [...prev, customCategory.trim()]);
        }

        try {
            const isEditing = !!editData?.id;
            const endpoint = isEditing ? `/api/recipes/${editData.id}` : "/api/recipes";
            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(endpoint, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    menu: {
                        id: generatedId,
                        nama_menu: data.nama_menu,
                        outlet_id: data.outlet_id,
                        outlet_name: outlets.find(o => o.id === data.outlet_id)?.name || data.outlet_id,
                        kategori: finalCategory,
                    },
                    resep: data.resep
                })
            });

            const errData = await res.json();
            if (!res.ok) {
                throw new Error(errData.error || "Gagal menyimpan resep");
            }

            if (errData.warning) {
                toast.warning(errData.warning);
            } else {
                toast.success(`Produk "${data.nama_menu}" (${generatedId}) berhasil disimpan!`);
            }
            setOpen(false);
            reset();
            setGeneratedId("");
            setIsCustomCategory(false);
            setCustomCategory("");

            window.location.reload();
        } catch (error: unknown) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Terjadi kesalahan sistem");
        } finally {
            setLoading(false);
        }
    };

    const handleAIMatch = async () => {
        const currentReseps = form.getValues().resep;

        // Find inputs that aren't exact UUIDs or don't seem like standard bhn_ keys
        const questionableInputs = currentReseps.map((r, index) => ({
            input: r.bahan_id,
            index
        })).filter(x => x.input && !x.input.startsWith('bhn_') && !allBahan.some(b => b.id === x.input));

        if (questionableInputs.length === 0) {
            toast.info("Semua bahan baku sudah valid (ID exist di katalog).");
            return;
        }

        setAiLoading(true);
        toast.loading("Menganalisis kemiripan dengan Master Bahan...", { id: 'ai-match' });

        try {
            const res = await fetch("/api/ai-ingredient-match", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userInputs: questionableInputs.map(q => q.input),
                    catalog: allBahan.map(b => ({
                        id: b.id,
                        nama_bahan: b.nama_bahan,
                        satuan_dasar: b.satuan_dasar
                    }))
                })
            });

            if (!res.ok) throw new Error("Gagal menyusun data melalui AI");

            const matchData = await res.json();
            const matchedIndexes: number[] = [];

            matchData.forEach((matchResult: any) => {
                const targetQ = questionableInputs.find(q => q.input === matchResult.original_input);
                if (targetQ && matchResult.matched_id) {
                    setValue(`resep.${targetQ.index}.bahan_id`, matchResult.matched_id);
                    setValue(`resep.${targetQ.index}.satuan`, matchResult.satuan || 'pcs');
                    matchedIndexes.push(targetQ.index);
                }
            });

            if (matchedIndexes.length > 0) {
                setAiMatchedIndexes(prev => [...prev, ...matchedIndexes]);
                toast.success(`Berhasil mencocokkan ${matchedIndexes.length} komposisi! ✨`, { id: 'ai-match' });
            } else {
                toast.error("AI tidak menemukan kemiripan yang cukup kuat di master katalog.", { id: 'ai-match' });
            }

        } catch (error: any) {
            console.error(error);
            toast.error(error.message, { id: 'ai-match' });
        } finally {
            setAiLoading(false);
        }
    };

    const outletDisplayName = outlets.find(o => o.id === watchOutlet)?.name || "";

    return (
        <>
            <LoadingOverlay isVisible={loading} message="Nuclear Sync: Menyimpan & Mewariskan ke Sheets..." />
            <Dialog open={open} onOpenChange={(val) => {
                if (!val) {
                    reset();
                    setIsCustomCategory(false);
                    setCustomCategory("");
                }
                setOpen(val);
            }}>
                <DialogTrigger asChild>
                    {triggerElement || (
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Tambah Produk / Resep
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[580px] bg-card text-foreground max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editData ? "Edit Resep Dinamis" : "Membangun Resep Dinamis"}</DialogTitle>
                        <DialogDescription>
                            {editData ? "Ubah komposisi resep untuk menu ini." : "Tambahkan Menu beserta komposisi resep (Bahan Mentah atau Sub-Resep)."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        {/* Outlet Select */}
                        <div className="space-y-2">
                            <Label>Outlet <span className="text-red-500">*</span></Label>
                            <div className="flex gap-2">
                                <Controller
                                    control={control}
                                    name="outlet_id"
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
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
                                    )}
                                />
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
                            {errors.outlet_id && <p className="text-xs text-red-500">{errors.outlet_id.message}</p>}
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
                            <Label>Kategori <span className="text-red-500">*</span></Label>
                            {isCustomCategory ? (
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Ketik kategori baru (cth: Snack, Merchandise)"
                                        value={customCategory}
                                        onChange={(e) => {
                                            setCustomCategory(e.target.value);
                                            setValue("kategori", e.target.value);
                                        }}
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
                                            setValue("kategori", "Food");
                                        }}
                                    >
                                        Batal
                                    </Button>
                                </div>
                            ) : (
                                <Controller
                                    control={control}
                                    name="kategori"
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={handleCategorySelect}>
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
                                />
                            )}
                            {errors.kategori && <p className="text-xs text-red-500">{errors.kategori.message}</p>}
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
                            <Label htmlFor="nama_menu">Nama Menu/Produk <span className="text-red-500">*</span></Label>
                            <Input
                                id="nama_menu"
                                placeholder="Cth: Nasi Goreng Spesial"
                                {...form.register("nama_menu")}
                            />
                            {errors.nama_menu && <p className="text-xs text-red-500">{errors.nama_menu.message}</p>}
                        </div>

                        {/* Resep / Komposisi */}
                        <div className="pt-4 border-t border-border mt-4">
                            <div className="flex justify-between items-center mb-3">
                                <div>
                                    <Label className="font-semibold block flex items-center gap-2">
                                        Komposisi (BOM)
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            className="h-6 text-[10px] bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 px-2"
                                            onClick={handleAIMatch}
                                            disabled={aiLoading}
                                        >
                                            {aiLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                                            AI Auto-Match
                                        </Button>
                                    </Label>
                                    <span className="text-xs text-muted-foreground">Isi nama bahan mentah / sub-resep.</span>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={() => append({ bahan_id: "", jumlah_pakai: 1, satuan: "pcs" })} className="h-8 text-xs">
                                    <Plus className="h-3 w-3 mr-1" /> Baris Baru
                                </Button>
                            </div>
                            <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex gap-2">
                                        <div className="flex-1 min-w-[200px]">
                                            <Controller
                                                control={control}
                                                name={`resep.${index}.bahan_id`}
                                                render={({ field }) => {
                                                    const selectedBahan = allBahan.find(b => b.id === field.value);
                                                    const displayName = selectedBahan ? selectedBahan.nama_bahan : field.value;
                                                    const isAiMatched = aiMatchedIndexes.includes(index);

                                                    return (
                                                        <Popover
                                                            open={openComboboxes[index] || false}
                                                            onOpenChange={(open) => setOpenComboboxes(prev => ({ ...prev, [index]: open }))}
                                                        >
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    className={cn(
                                                                        "w-full justify-between text-left font-normal truncate",
                                                                        !selectedBahan && field.value ? "border-amber-500/50 bg-amber-500/5 text-amber-600 dark:text-amber-400" : "",
                                                                        isAiMatched ? "border-indigo-500/50 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400" : ""
                                                                    )}
                                                                >
                                                                    {displayName || "Pilih Bahan..."}
                                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[300px] p-0" align="start">
                                                                <Command>
                                                                    <CommandInput
                                                                        placeholder="Cari katalog atau ketik manual..."
                                                                        onValueChange={(raw: string) => {
                                                                            field.onChange(raw);
                                                                        }}
                                                                    />
                                                                    <CommandList>
                                                                        <CommandEmpty>
                                                                            <div className="p-3 text-sm text-center">
                                                                                <span className="text-muted-foreground">Bahan tidak ada di katalog.</span>
                                                                                <p className="text-xs mt-1 text-amber-500">Akan dicatat sebagai teks bebas.</p>
                                                                            </div>
                                                                        </CommandEmpty>
                                                                        <CommandGroup>
                                                                            {allBahan.map((bahan) => (
                                                                                <CommandItem
                                                                                    key={bahan.id}
                                                                                    value={bahan.nama_bahan} // use nama_bahan for string fuzzy searching
                                                                                    onSelect={() => {
                                                                                        field.onChange(bahan.id);
                                                                                        setValue(`resep.${index}.satuan`, bahan.satuan_dasar);
                                                                                        setOpenComboboxes(prev => ({ ...prev, [index]: false }));
                                                                                    }}
                                                                                >
                                                                                    <Check className={cn("mr-2 h-4 w-4", field.value === bahan.id ? "opacity-100" : "opacity-0")} />
                                                                                    <span className="truncate flex-1">{bahan.nama_bahan}</span>
                                                                                    <span className="text-[10px] text-muted-foreground ml-2 px-1 border rounded">{bahan.satuan_dasar}</span>
                                                                                </CommandItem>
                                                                            ))}
                                                                        </CommandGroup>
                                                                    </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                    )
                                                }}
                                            />
                                            {errors.resep?.[index]?.bahan_id && <p className="text-[10px] mt-1 text-red-500">{errors.resep[index].bahan_id?.message}</p>}
                                        </div>
                                        <div className="w-20">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                {...form.register(`resep.${index}.jumlah_pakai`, { valueAsNumber: true })}
                                            />
                                            {errors.resep?.[index]?.jumlah_pakai && <p className="text-[10px] mt-1 text-red-500">{errors.resep[index].jumlah_pakai?.message}</p>}
                                        </div>
                                        <div className="w-16">
                                            <Input
                                                placeholder="Unit"
                                                {...form.register(`resep.${index}.satuan`)}
                                            />
                                            {errors.resep?.[index]?.satuan && <p className="text-[10px] mt-1 text-red-500">{errors.resep[index].satuan?.message}</p>}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-destructive shrink-0"
                                            onClick={() => remove(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {fields.length === 0 && (
                                    <p className="text-sm text-amber-500 bg-amber-500/10 p-2 rounded text-center">Produk ini tidak memiliki BOM / Resep.</p>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-2 border-t border-border mt-6">
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan Dinamis
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

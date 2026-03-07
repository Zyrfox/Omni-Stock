"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";

const formSchema = z.object({
    nama_bahan: z.string().min(2, "Nama bahan minimal 2 karakter"),
    satuan_dasar: z.string().min(1, "Satuan dasar wajib diisi (cth: gram, ml, pcs)"),
    batas_minimum: z.number().min(0, "Batas minimum invalid"),
    harga_satuan: z.number().min(0, "Harga invalid"),
    kemasan_beli: z.string().min(1, "Kemasan Beli wajib diisi (cth: 1 Bal, 1 Dus)"),
    isi_kemasan: z.number().min(1, "Isi kemasan wajib diisi (cth: 10)"),
});

type FormValues = z.infer<typeof formSchema>;

interface BahanModalProps {
    editData?: Partial<FormValues> & { id?: string };
    triggerElement?: React.ReactNode;
}

export function BahanModal({ editData, triggerElement }: BahanModalProps = {}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nama_bahan: editData?.nama_bahan || "",
            satuan_dasar: editData?.satuan_dasar || "pcs",
            batas_minimum: editData?.batas_minimum || 5,
            harga_satuan: editData?.harga_satuan || 0,
            kemasan_beli: editData?.kemasan_beli || "Pack",
            isi_kemasan: editData?.isi_kemasan || 1,
        }
    });

    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = form;

    const watchNamaBahan = watch("nama_bahan");
    const watchKemasanBeli = watch("kemasan_beli");
    const watchSatuanDasar = watch("satuan_dasar");

    const onAskAI = async () => {
        if (!watchNamaBahan || !watchKemasanBeli || !watchSatuanDasar) {
            toast.error("Isi Nama Bahan, Kemasan Beli, dan Satuan Dasar dulu untuk tanya AI");
            return;
        }

        setAiLoading(true);
        try {
            const res = await fetch("/api/ai-yield-estimator", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bahan_nama: watchNamaBahan,
                    kemasan_beli: watchKemasanBeli,
                    satuan_saji: watchSatuanDasar
                })
            });

            if (!res.ok) throw new Error("Gagal memanggil AI Yield Estimator");

            const data = await res.json();
            if (data.estimated_yield_qty) {
                setValue("isi_kemasan", data.estimated_yield_qty);
                toast.success("AI: " + data.reasoning);
            }
        } catch (error: unknown) {
            console.error(error);
            toast.error("Gagal mendapatkan estimasi dari AI");
        } finally {
            setAiLoading(false);
        }
    };

    const onSubmit = async (data: FormValues) => {
        setLoading(true);
        try {
            const res = await fetch("/api/materials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editData?.id,
                    nama_bahan: data.nama_bahan,
                    satuan_dasar: data.satuan_dasar,
                    batas_minimum: data.batas_minimum,
                    harga_satuan: data.harga_satuan,
                    kemasan_beli: data.kemasan_beli,
                    isi_kemasan: data.isi_kemasan
                })
            });

            const errData = await res.json();
            if (!res.ok) {
                throw new Error(errData.error || "Gagal menyimpan bahan");
            }

            if (errData.warning) {
                toast.warning(errData.warning);
            } else {
                toast.success(`Bahan "${data.nama_bahan}" berhasil disimpan dan tersinkronisasi!`);
            }

            setOpen(false);
            if (!editData?.id) reset(); // Reset form if not in edit mode

            // Need a hard refresh to get new data for Server Components
            window.location.reload();
        } catch (error: unknown) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Terjadi kesalahan sistem");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <LoadingOverlay isVisible={loading} message="Nuclear Sync: Menyimpan & Mewariskan ke Sheets..." />
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {triggerElement || (
                        <Button variant="secondary" className="gap-2">
                            <Plus className="h-4 w-4" /> Tambah Bahan
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-card text-foreground">
                    <DialogHeader>
                        <DialogTitle>{editData?.id ? "Edit Master Bahan" : "Tambah Master Bahan"}</DialogTitle>
                        <DialogDescription>
                            Tambahkan bahan mentah / volatile ke dalam Master Data.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>Nama Bahan Khusus</Label>
                            <Input placeholder="Cth: Es Batu Kristal" {...register("nama_bahan")} />
                            {errors.nama_bahan && <p className="text-xs text-red-500">{errors.nama_bahan.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Kemasan Beli</Label>
                                <Input placeholder="Cth: 1 Bal (10kg)" {...register("kemasan_beli")} />
                            </div>
                            <div className="space-y-2">
                                <Label>Satuan Dapur</Label>
                                <Input placeholder="Cth: gram / porsi / cup" {...register("satuan_dasar")} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Isi Kemasan (Yield per Kemasan Beli)</Label>
                            <div className="flex gap-2">
                                <Input type="number" step="0.01" className="flex-1" {...register("isi_kemasan", { valueAsNumber: true })} />
                                <Button type="button" variant="outline" onClick={onAskAI} disabled={aiLoading} className="gap-2 shrink-0 bg-lime-500/10 text-lime-600 border-lime-500/30 hover:bg-lime-500/20">
                                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                    Tanya AI
                                </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">Gunakan Tanya AI untuk bahan volatile (contoh: yield bersih daging, rasio es batu).</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Harga Beli Kemasan</Label>
                                <Input type="number" step="100" placeholder="Cth: 150000" {...register("harga_satuan", { valueAsNumber: true })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Batas Minimum Stock</Label>
                                <Input type="number" step="1" {...register("batas_minimum", { valueAsNumber: true })} />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-2 border-t border-border mt-6">
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan Bahan
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, FileText, ShoppingCart, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { usePOBuilder, POItem } from "@/lib/store/usePOBuilder";
import { saveInvoiceDrafts } from "@/app/actions/invoice";
import { useState } from "react";

export function InvoiceGenerator() {
    const { approvedPOs, clearPOs, removePO } = usePOBuilder();
    const printRef = useRef<HTMLDivElement>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `PO_Invoice_${new Date().toISOString().split('T')[0]}`,
        onAfterPrint: () => {
            toast.success("PDF berhasil dicetak");
            clearPOs(); // Automatically clear after saving and printing
        },
    });

    // Group items by Vendor
    const groupedPOs = approvedPOs.reduce((acc, item) => {
        if (!acc[item.vendor_nama]) acc[item.vendor_nama] = [];
        acc[item.vendor_nama].push(item);
        return acc;
    }, {} as Record<string, POItem[]>);

    const grandTotal = approvedPOs.reduce((sum, item) => sum + (item.qty * (item.harga_satuan || 0)), 0);

    const handleCopyText = (vendorName: string, items: POItem[]) => {
        let text = `*DRAFT PO - ${vendorName}*\nTanggal: ${new Date().toLocaleDateString('id-ID')}\n\n`;
        let total = 0;

        items.forEach((item, idx) => {
            const subtotal = item.qty * (item.harga_satuan || 0);
            total += subtotal;
            text += `${idx + 1}. ${item.nama_bahan}\n   ${item.qty} x Rp ${(item.harga_satuan || 0).toLocaleString('id-ID')} = Rp ${subtotal.toLocaleString('id-ID')}\n`;
        });

        text += `\n*Total Estimasi: Rp ${total.toLocaleString('id-ID')}*`;
        const paymentInfo = items.find(i => i.info_pembayaran)?.info_pembayaran;
        if (paymentInfo) {
            text += `\n\nInfo Pembayaran Vendor:\n${paymentInfo}`;
        }

        navigator.clipboard.writeText(text);
        toast.success("Teks disalin ke Clipboard!", { description: `Format WA untuk vendor ${vendorName} siap dikirim.` });
    };

    const handleExportAndSave = async () => {
        setIsSaving(true);
        try {
            const res = await saveInvoiceDrafts(groupedPOs);
            if (res.success) {
                toast.success("Invoice berhasil disimpan ke Arsip!");
                handlePrint();
            } else {
                toast.error("Gagal menyimpan Invoice ke Database", { description: res.error });
            }
        } catch (err: any) {
            toast.error("Error Sistem", { description: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    if (approvedPOs.length === 0) {
        return (
            <Card className="h-full border-white/10 flex flex-col items-center justify-center p-8 text-center bg-secondary/10">
                <div className="h-16 w-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
                <h3 className="text-lg font-semibold text-muted-foreground">Keranjang PO Kosong</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-[250px]">
                    Klik tombol "Rancang PO" pada tabel inventory untuk mulai menyusun PO dan Invoice.
                </p>
            </Card>
        );
    }

    return (
        <Card className="h-full border-white/10 flex flex-col shadow-xl">
            <CardHeader className="bg-lime-500/10 border-b border-lime-500/20 pb-4">
                <CardTitle className="text-lg flex justify-between items-center text-lime-600 dark:text-lime-400">
                    <span className="flex items-center gap-2"><FileText className="h-5 w-5" /> Draft Invoices</span>
                    <Badge variant="outline" className="border-lime-500/50 bg-lime-500/10">{approvedPOs.length} Items</Badge>
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-0" ref={printRef}>
                <div className="p-4 sm:p-6 space-y-6">
                    {/* Header for PDF printing only */}
                    <div className="hidden print:block text-center border-b pb-4 mb-6">
                        <h1 className="text-2xl font-bold">PURCHASE ORDER INVOICE</h1>
                        <p className="text-sm text-gray-500">Divisi Logistik & Inventory</p>
                        <p className="text-sm">Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
                    </div>

                    {Object.entries(groupedPOs).map(([vendor, items]) => {
                        const vendorTotal = items.reduce((sum, item) => sum + (item.qty * (item.harga_satuan || 0)), 0);
                        const paymentInfo = items.find(i => i.info_pembayaran)?.info_pembayaran;

                        return (
                            <div key={vendor} className="bg-secondary/20 rounded-xl p-4 border border-border">
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-bold text-foreground">{vendor}</h4>
                                    <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-500 hover:text-blue-400 print:hidden" onClick={() => handleCopyText(vendor, items)}>
                                        <MessageCircle className="h-3.5 w-3.5 mr-1" /> WA Text
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {items.map((item) => (
                                        <div key={item.id_bahan} className="flex justify-between items-center group">
                                            <div>
                                                <p className="text-sm font-medium">{item.nama_bahan}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                    <span>{item.qty} x Rp {(item.harga_satuan || 0).toLocaleString('id-ID')}</span>
                                                    <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity print:hidden text-destructive" onClick={() => removePO(item.id_bahan)}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <p className="font-semibold text-sm">
                                                Rp {(item.qty * (item.harga_satuan || 0)).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <hr className="my-3 opacity-50 border-border" />
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground font-medium">Subtotal Vendor:</span>
                                    <span className="font-bold text-amber-600 dark:text-amber-500">Rp {vendorTotal.toLocaleString('id-ID')}</span>
                                </div>
                                {paymentInfo && (
                                    <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
                                        <span className="font-semibold block mb-0.5 text-muted-foreground">Pembayaran:</span>
                                        {paymentInfo}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>

            <hr className="border-border" />

            <CardFooter className="flex-col gap-4 p-4 sm:p-6 bg-secondary/10 print:hidden">
                <div className="flex justify-between items-center w-full">
                    <span className="font-semibold text-muted-foreground">Grand Total Estimasi</span>
                    <span className="text-2xl font-bold">Rp {grandTotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full">
                    <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={clearPOs} disabled={isSaving}>
                        <Trash2 className="h-4 w-4 mr-2" /> Kosongkan
                    </Button>
                    <Button className="bg-lime-500 text-black hover:bg-lime-600 shadow-md shadow-lime-500/20" onClick={handleExportAndSave} disabled={isSaving}>
                        <FileText className="h-4 w-4 mr-2" /> {isSaving ? "Menyimpan..." : "Export PDF & Simpan"}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}

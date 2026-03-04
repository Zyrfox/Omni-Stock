"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileDown, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function InvoiceActions({ invoiceId, vendorName, items }: { invoiceId: string, vendorName: string, items: any[] }) {
    const [open, setOpen] = useState(false);

    // TODO: Implement actual PDF generation for past invoices if needed, or just a dummy alert for now
    const handleDownload = () => {
        alert("Fitur Download PDF Histori segera hadir!");
    };

    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setOpen(true)}>
                <Eye className="h-3.5 w-3.5 mr-1" /> Details
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={handleDownload}>
                <FileDown className="h-3.5 w-3.5 mr-1" /> PDF
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Invoice Details - {vendorName}</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        <div className="border rounded-md overflow-hidden">
                            <Table>
                                <TableHeader className="bg-secondary/50">
                                    <TableRow>
                                        <TableHead>Nama Bahan</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Harga Satuan</TableHead>
                                        <TableHead className="text-right">Subtotal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.nama_bahan}</TableCell>
                                            <TableCell className="text-right">{item.qty}</TableCell>
                                            <TableCell className="text-right">Rp {item.harga_satuan.toLocaleString('id-ID')}</TableCell>
                                            <TableCell className="text-right font-semibold">Rp {(item.qty * item.harga_satuan).toLocaleString('id-ID')}</TableCell>
                                        </TableRow>
                                    ))}
                                    {items.length === 0 && (
                                        <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">Tidak ada item.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

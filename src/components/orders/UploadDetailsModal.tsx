"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, CheckCircle2, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface UploadDetail {
    id: string;
    nama_bahan_raw: string;
    is_matched: boolean;
}

export function UploadDetailsModal({ batchId, details }: { batchId: string, details: UploadDetail[] }) {
    const [open, setOpen] = useState(false);

    const matched = details.filter(d => d.is_matched);
    const unmatched = details.filter(d => !d.is_matched);

    return (
        <>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setOpen(true)}>
                <Eye className="h-3.5 w-3.5 mr-1" /> View Details
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md max-h-[75vh] overflow-y-auto flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Detail Upload Batch</DialogTitle>
                        <div className="text-xs text-muted-foreground font-mono mt-1 blur-[0.5px] select-all">{batchId}</div>
                    </DialogHeader>

                    <div className="flex gap-4 my-2">
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-100 border-0">
                            {matched.length} Matched
                        </Badge>
                        <Badge variant="destructive" className="border-0">
                            {unmatched.length} Unmatched
                        </Badge>
                    </div>

                    <ScrollArea className="flex-1 border rounded-md p-4">
                        {unmatched.length > 0 && (
                            <div className="mb-6">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-destructive mb-3">
                                    <AlertCircle className="w-4 h-4" /> Butuh Perbaikan di Master Data
                                </h4>
                                <ul className="space-y-2">
                                    {unmatched.map(u => (
                                        <li key={u.id} className="text-sm bg-destructive/10 text-destructive px-3 py-2 rounded-md font-medium">
                                            {u.nama_bahan_raw}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div>
                            <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-500 mb-3">
                                <CheckCircle2 className="w-4 h-4" /> Berhasil Sinkronisasi
                            </h4>
                            <ul className="space-y-2">
                                {matched.map(m => (
                                    <li key={m.id} className="text-sm bg-secondary px-3 py-2 rounded-md text-foreground">
                                        {m.nama_bahan_raw}
                                    </li>
                                ))}
                                {matched.length === 0 && <li className="text-sm text-muted-foreground">Tidak ada item matched.</li>}
                            </ul>
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </>
    );
}

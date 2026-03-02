'use client'

import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface CopyPOButtonProps {
    poId: string;
    bahanName: string;
    vendorName: string;
}

export function CopyPOButton({ poId, bahanName, vendorName }: CopyPOButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const text = `Halo *${vendorName}*.\n\nKami dari *Outlet O-001 OMNI-STOCK* membutuhkan *RESTOCK* untuk material: \n\n📦 *${bahanName}*\n\nMohon balas pesan ini dengan \n*"SETUJU ${poId}"* \nuntuk melanjutkan rekapitulasi PO ini.`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Pesan Disalin!', { description: 'Pesan WA sudah disalin ke clipboard.' });

        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <Button variant="ghost" size="sm" onClick={handleCopy} title="Copy WA Message" className="ml-2 w-8 h-8 p-0">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-slate-500" />}
        </Button>
    )
}

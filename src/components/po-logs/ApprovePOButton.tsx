'use client'

import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { approvePO } from "@/app/actions/po"

interface ApprovePOButtonProps {
    poId: string;
}

export function ApprovePOButton({ poId }: ApprovePOButtonProps) {
    const [isApproving, setIsApproving] = useState(false);

    const handleApprove = async () => {
        setIsApproving(true);
        const result = await approvePO(poId);
        setIsApproving(false);

        if (result.success) {
            toast.success('PO Approved', { description: result.message });
        } else {
            toast.error('Approval Failed', { description: result.error });
        }
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleApprove}
            disabled={isApproving}
            className="ml-2 h-8 text-green-600 border-green-200 hover:bg-green-50"
        >
            {isApproving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
                <CheckCircle2 className="h-4 w-4 mr-1" />
            )}
            Approve
        </Button>
    )
}

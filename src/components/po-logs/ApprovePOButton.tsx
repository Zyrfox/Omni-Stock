'use client'

import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { approvePO, undoPO } from "@/app/actions/po"

interface ApprovePOButtonProps {
    poId: string;
    isUndo?: boolean;
}


export function ApprovePOButton({ poId, isUndo = false }: ApprovePOButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleAction = async () => {
        setIsLoading(true);
        const result = isUndo ? await undoPO(poId) : await approvePO(poId);
        setIsLoading(false);

        if (result.success) {
            toast.success(isUndo ? 'PO Canceled' : 'PO Approved', { description: result.message });
        } else {
            toast.error('Action Failed', { description: result.error });
        }
    }

    if (isUndo) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={handleAction}
                disabled={isLoading}
                className="h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                    <XCircle className="h-4 w-4 mr-1" />
                )}
                Batal
            </Button>
        )
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleAction}
            disabled={isLoading}
            className="ml-2 h-8 text-green-600 border-green-200 hover:bg-green-50"
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
                <CheckCircle2 className="h-4 w-4 mr-1" />
            )}
            Approve
        </Button>
    )
}

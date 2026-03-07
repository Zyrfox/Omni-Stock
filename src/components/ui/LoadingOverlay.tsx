import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
    isVisible: boolean;
    message?: string;
}

export function LoadingOverlay({ isVisible, message = "Memproses Sinkronisasi Data..." }: LoadingOverlayProps) {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300">
            <div className="flex flex-col items-center gap-4 bg-card p-8 rounded-2xl shadow-2xl border border-border">
                <div className="h-16 w-16 bg-lime-500/10 text-lime-600 dark:text-lime-500 rounded-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
                <div className="text-center space-y-1">
                    <h3 className="text-lg font-semibold tracking-tight">{message}</h3>
                    <p className="text-sm text-muted-foreground">Mohon tunggu sebentar, jangan tutup halaman ini.</p>
                </div>
            </div>
        </div>
    );
}

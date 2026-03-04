import { LockKeyhole } from "lucide-react"

export default function BillingPage() {
    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-8rem)] relative">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Billing</h2>
                <p className="text-slate-500 dark:text-slate-400">Manajemen tagihan dan invoice keuangan vendor.</p>
            </div>

            {/* Background Blur Overlay Effect */}
            <div className="absolute inset-0 top-20 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md rounded-xl border border-border/50 shadow-sm overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90 z-0"></div>

                <div className="z-10 flex flex-col items-center justify-center p-8 text-center max-w-md animate-in fade-in zoom-in duration-500">
                    <div className="bg-primary/10 p-4 rounded-full mb-6 ring-8 ring-primary/5">
                        <LockKeyhole className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight mb-2">Billing & Finance Module</h3>
                    <p className="text-muted-foreground">
                        Fitur ini sedang dalam tahap pengembangan. Coming soon!
                    </p>
                </div>
            </div>

            {/* Dummy Skeleton Data to look cool behind the blur */}
            <div className="opacity-30 pointer-events-none select-none mt-4 border rounded-xl overflow-hidden bg-card">
                <div className="h-14 border-b bg-muted/50 flex items-center px-6 gap-8">
                    <div className="h-4 w-32 bg-muted-foreground/20 rounded"></div>
                    <div className="h-4 w-24 bg-muted-foreground/20 rounded"></div>
                    <div className="h-4 w-40 bg-muted-foreground/20 rounded ml-auto"></div>
                </div>
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 border-b flex items-center px-6 gap-8">
                        <div className="h-4 w-48 bg-muted-foreground/10 rounded"></div>
                        <div className="h-4 w-32 bg-muted-foreground/10 rounded"></div>
                        <div className="h-6 w-16 bg-muted-foreground/20 rounded-full ml-auto"></div>
                    </div>
                ))}
            </div>
        </div>
    )
}

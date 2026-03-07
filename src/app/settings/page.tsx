'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, DownloadCloud, Database, CheckCircle2, CloudCog } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"

export default function SettingsPage() {
    const [isSyncing, setIsSyncing] = useState(false)

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch("/api/sync/trigger", { method: "POST" });
            const result = await res.json();

            if (res.ok && result.success) {
                toast.success("Sync Successful", { description: result.message });
            } else {
                toast.error("Sync Failed", { description: result.error || "Unknown error occurred" });
            }
        } catch (err: unknown) {
            toast.error("Sync Error", { description: err instanceof Error ? err.message : "Gagal menghubungi server untuk sinkronisasi." });
        } finally {
            setIsSyncing(false);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Settings</h2>
                <p className="text-slate-500 dark:text-slate-400">System configuration and manual triggers.</p>
            </div>

            {/* Google Sheets API Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CloudCog className="h-5 w-5" />
                        Google Sheets API (v4)
                    </CardTitle>
                    <CardDescription>
                        Sync data langsung dari Google Sheets menggunakan Service Account API.
                        Konfigurasi dilakukan via environment variables.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm border border-emerald-100 dark:border-emerald-800/50">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>
                            Menggunakan <span className="font-mono font-semibold">GOOGLE_SHEETS_ID</span> dari environment variables.
                            CSV links tidak diperlukan lagi.
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="bg-muted/50 px-3 py-2 rounded-lg">
                            <span className="text-muted-foreground">Spreadsheet:</span>
                            <p className="font-mono font-medium mt-0.5 truncate">{process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID || '••• configured •••'}</p>
                        </div>
                        <div className="bg-muted/50 px-3 py-2 rounded-lg">
                            <span className="text-muted-foreground">Sheets Sync:</span>
                            <p className="font-medium mt-0.5">Master_Vendor, Master_Bahan, Master_Menu, Master_Resep</p>
                        </div>
                        <div className="bg-muted/50 px-3 py-2 rounded-lg">
                            <span className="text-muted-foreground">Auth Method:</span>
                            <p className="font-medium mt-0.5">Service Account (GoogleAuth)</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Master Data Sync
                        </CardTitle>
                        <CardDescription>Sync data dari Google Sheets API ke database. Data akan diambil langsung dari spreadsheet.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="flex items-center gap-2" onClick={handleSync} disabled={isSyncing}>
                            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                            {isSyncing ? "Syncing..." : "Sync Master Data Now"}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Database Export</CardTitle>
                        <CardDescription>Download a backup of the current SQLite primary database for safekeeping.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <a href="/api/export-db" download>
                            <Button variant="outline" className="flex items-center gap-2 text-slate-600">
                                <DownloadCloud className="h-4 w-4" />
                                Export SQLite Database
                            </Button>
                        </a>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

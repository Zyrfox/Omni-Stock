'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, DownloadCloud, Save, Link2, CheckCircle2 } from "lucide-react"
import { syncMasterData } from "@/app/actions/sync"
import { toast } from "sonner"
import { useState, useEffect } from "react"

const CSV_KEYS = [
    { key: 'CSV_URL_VENDOR', label: 'Master Vendor', placeholder: 'https://docs.google.com/spreadsheets/d/e/.../pub?gid=...&output=csv' },
    { key: 'CSV_URL_BAHAN', label: 'Master Bahan Baku', placeholder: 'https://docs.google.com/spreadsheets/d/e/.../pub?gid=...&output=csv' },
    { key: 'CSV_URL_MENU', label: 'Master Menu', placeholder: 'https://docs.google.com/spreadsheets/d/e/.../pub?gid=...&output=csv' },
    { key: 'CSV_URL_RESEP', label: 'Mapping Resep', placeholder: 'https://docs.google.com/spreadsheets/d/e/.../pub?gid=...&output=csv' },
];

const STORAGE_KEY = 'omni_stock_csv_urls';

function loadUrls(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
}

function saveUrls(urls: Record<string, string>) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
}

export default function SettingsPage() {
    const [isSyncing, setIsSyncing] = useState(false)
    const [csvUrls, setCsvUrls] = useState<Record<string, string>>({})
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        setCsvUrls(loadUrls());
    }, [])

    const handleSaveUrls = () => {
        saveUrls(csvUrls);
        setSaved(true);
        toast.success("CSV URLs Saved!", { description: "Link tersimpan di browser." });
        setTimeout(() => setSaved(false), 3000);
    }

    const handleSync = async () => {
        // Save first, then sync with URLs passed directly
        saveUrls(csvUrls);
        setIsSyncing(true);
        try {
            const result = await syncMasterData(csvUrls);
            if (result.success) {
                toast.success("Sync Successful", { description: result.message });
            } else {
                toast.error("Sync Failed", { description: result.error });
            }
        } catch (err) {
            toast.error("Sync Error", { description: "Terjadi error saat sync. Cek console untuk detail." });
        } finally {
            setIsSyncing(false);
        }
    }

    const filledCount = CSV_KEYS.filter(c => csvUrls[c.key]?.trim()).length;

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Settings</h2>
                <p className="text-slate-500 dark:text-slate-400">System configuration and manual triggers.</p>
            </div>

            {/* CSV URL Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5" />
                        Google Sheets CSV Links
                    </CardTitle>
                    <CardDescription>
                        Masukkan link CSV dari Google Sheets yang sudah di-publish.
                        Buka Google Sheets → File → Share → Publish to web → pilih sheet → format CSV → Copy link.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {CSV_KEYS.map(({ key, label, placeholder }) => (
                        <div key={key} className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                {label}
                                {csvUrls[key]?.trim() && (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                )}
                            </label>
                            <input
                                type="url"
                                className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                                placeholder={placeholder}
                                value={csvUrls[key] || ''}
                                onChange={(e) => setCsvUrls(prev => ({ ...prev, [key]: e.target.value }))}
                            />
                        </div>
                    ))}

                    <div className="flex items-center gap-3 pt-2">
                        <Button onClick={handleSaveUrls} className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            Save CSV Links
                        </Button>
                        <span className="text-xs text-slate-500">
                            {filledCount}/4 links configured
                        </span>
                        {saved && (
                            <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Saved!
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Master Data Sync</CardTitle>
                        <CardDescription>Sync data dari Google Sheets CSV ke database. Pastikan CSV links sudah di-isi di atas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="flex items-center gap-2" onClick={handleSync} disabled={isSyncing || filledCount < 3}>
                            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                            {isSyncing ? "Syncing..." : "Sync Master Data Now"}
                        </Button>
                        {filledCount < 3 && (
                            <p className="text-xs text-amber-500 mt-2">⚠️ Minimal 3 CSV links (Vendor, Bahan, Menu) harus di-isi sebelum sync.</p>
                        )}
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

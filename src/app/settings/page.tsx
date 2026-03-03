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

export default function SettingsPage() {
    const [isSyncing, setIsSyncing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [csvUrls, setCsvUrls] = useState<Record<string, string>>({})
    const [saved, setSaved] = useState(false)

    // Load saved settings on mount
    useEffect(() => {
        async function loadSettings() {
            try {
                const res = await fetch('/api/settings')
                if (res.ok) {
                    const data = await res.json()
                    setCsvUrls(data)
                }
            } catch (e) {
                console.error("Failed to load settings", e)
            }
        }
        loadSettings()
    }, [])

    const handleSaveUrls = async () => {
        setIsSaving(true)
        setSaved(false)
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: csvUrls }),
            })
            const data = await res.json()
            if (data.success) {
                toast.success("CSV URLs Saved!", { description: "Link Google Sheets berhasil disimpan." })
                setSaved(true)
                setTimeout(() => setSaved(false), 3000)
            } else {
                toast.error("Save Failed", { description: data.error })
            }
        } catch {
            toast.error("Save Failed", { description: "Network error" })
        } finally {
            setIsSaving(false)
        }
    }

    const handleSync = async () => {
        setIsSyncing(true)
        const result = await syncMasterData()
        setIsSyncing(false)
        if (result.success) {
            toast.success("Sync Successful", { description: result.message })
        } else {
            toast.error("Sync Failed", { description: result.error })
        }
    }

    const filledCount = CSV_KEYS.filter(c => csvUrls[c.key]?.trim()).length

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
                        <Button onClick={handleSaveUrls} disabled={isSaving} className="flex items-center gap-2">
                            <Save className={`h-4 w-4 ${isSaving ? "animate-spin" : ""}`} />
                            {isSaving ? "Saving..." : "Save CSV Links"}
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
                {/* Sync Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Master Data Sync</CardTitle>
                        <CardDescription>Sync data dari Google Sheets CSV ke database lokal. Pastikan CSV links sudah di-save di atas.</CardDescription>
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

                {/* Export Card */}
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

'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, DownloadCloud } from "lucide-react"
import { syncMasterData } from "@/app/actions/sync"
import { toast } from "sonner"
import { useState } from "react"

export default function SettingsPage() {
    const [isSyncing, setIsSyncing] = useState(false)

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

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Settings</h2>
                <p className="text-slate-500 dark:text-slate-400">System configuration and manual triggers.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Master Data Sync</CardTitle>
                        <CardDescription>Manually trigger a sync with the Master Data Google Sheet instead of waiting for the automated background job.</CardDescription>
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

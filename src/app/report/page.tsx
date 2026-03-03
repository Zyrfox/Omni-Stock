import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart } from "lucide-react"

export default function ReportPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Report</h2>
                <p className="text-slate-500 dark:text-slate-400">Generate and export detailed analytics reports.</p>
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="bg-secondary p-3 rounded-xl shrink-0">
                            <BarChart className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                            <CardTitle className="mb-1">Module Coming Soon</CardTitle>
                            <CardDescription>
                                The advanced reporting and analytics module is currently under active development.
                                Custom PDF and CSV exports will be supported in future versions.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>
        </div>
    )
}

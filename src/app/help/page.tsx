import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CircleHelp } from "lucide-react"

export default function HelpPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Help & Support</h2>
                <p className="text-slate-500 dark:text-slate-400">Get assistance, read documentation, or contact support.</p>
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="bg-secondary p-3 rounded-xl shrink-0">
                            <CircleHelp className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                            <CardTitle className="mb-1">Documentation Portal</CardTitle>
                            <CardDescription>
                                The master documentation knowledge base and ticketing system is currently under construction.
                                For urgent requests, please contact the administrator directly.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>
        </div>
    )
}

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tags } from "lucide-react"

export default function CategoryPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Category</h2>
                <p className="text-slate-500 dark:text-slate-400">Manage your product and item categories.</p>
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="bg-secondary p-3 rounded-xl shrink-0">
                            <Tags className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                            <CardTitle className="mb-1">Module Coming Soon</CardTitle>
                            <CardDescription>
                                The categorization module is currently under active development.
                                Updates to your schemas will be reflected here in future versions.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>
        </div>
    )
}

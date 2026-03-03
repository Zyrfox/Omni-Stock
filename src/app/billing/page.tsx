import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Receipt } from "lucide-react"

export default function BillingPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Billing</h2>
                <p className="text-slate-500 dark:text-slate-400">Manage invoices, payments, and financial records.</p>
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="bg-secondary p-3 rounded-xl shrink-0">
                            <Receipt className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                            <CardTitle className="mb-1">Module Coming Soon</CardTitle>
                            <CardDescription>
                                The billing and invoice management module is currently under active development.
                                Payment integrations will be available in future updates.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>
        </div>
    )
}

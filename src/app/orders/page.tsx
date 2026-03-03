import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart } from "lucide-react"

export default function OrdersPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Orders</h2>
                <p className="text-slate-500 dark:text-slate-400">Track and manage customer purchase orders.</p>
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="bg-secondary p-3 rounded-xl shrink-0">
                            <ShoppingCart className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                            <CardTitle className="mb-1">Module Coming Soon</CardTitle>
                            <CardDescription>
                                The order fulfillment module is currently under active development.
                                Detailed workflows will be available in future releases.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>
        </div>
    )
}

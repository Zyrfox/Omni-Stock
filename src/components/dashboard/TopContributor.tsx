import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/db"
import { uploadBatches, invoices } from "@/db/schema"

export async function TopContributor() {
    // Determine Top Contributors based on upload batches and invoices count
    const allBatches = await db.select().from(uploadBatches);
    const allInvoices = await db.select().from(invoices);

    const userActivity: Record<string, { uploads: number, pos: number, total: number }> = {};

    allBatches.forEach(b => {
        const u = b.created_by || 'System';
        if (!userActivity[u]) userActivity[u] = { uploads: 0, pos: 0, total: 0 };
        userActivity[u].uploads++;
        userActivity[u].total++;
    });

    allInvoices.forEach(inv => {
        const u = inv.created_by || 'System';
        if (!userActivity[u]) userActivity[u] = { uploads: 0, pos: 0, total: 0 };
        userActivity[u].pos++;
        userActivity[u].total++;
    });

    const sortedUsers = Object.entries(userActivity)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 3); // Top 3

    return (
        <Card className="h-full border-indigo-500/10 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none"></div>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg text-indigo-700 dark:text-indigo-400">🏅 Top Contributors</CardTitle>
                <CardDescription>Most active staff members</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 mt-2">
                    {sortedUsers.length > 0 ? sortedUsers.map(([username, stats], idx) => (
                        <div key={username} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                            <div className="flex gap-3 items-center">
                                <span className={`text-lg font-bold w-6 text-center ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : 'text-amber-700'}`}>#{idx + 1}</span>
                                <div>
                                    <p className="font-medium text-sm leading-none">{username}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{stats.uploads} Uploads • {stats.pos} POs</p>
                                </div>
                            </div>
                            <div className="text-sm font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 px-2.5 py-1 rounded-full">
                                {stats.total}
                            </div>
                        </div>
                    )) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Belum ada riwayat aktivitas.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

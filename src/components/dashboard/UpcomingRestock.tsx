"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, Package } from "lucide-react";

export function UpcomingRestock() {
    const [restockData, setRestockData] = useState<any[]>([]);

    useEffect(() => {
        async function fetchRestock() {
            try {
                const res = await fetch("/api/inventory/restock-prediction");
                if (res.ok) {
                    const data = await res.json();

                    const formatted = data.map((item: any) => ({
                        item: item.nama_bahan,
                        qtyNeeded: `Auto-PO ${item.vendor_id || ""}`,
                        date: `In ${item.days_remaining} Days`,
                        icon: Package,
                        iconBg: "bg-primary/10",
                        iconColor: "text-primary"
                    }));

                    setRestockData(formatted.slice(0, 5));
                }
            } catch (error) {
                console.error("Failed to fetch upcoming restocks", error);
            }
        }
        fetchRestock();
    }, []);

    return (
        <Card className="h-full border-white/10 dark:border-white/5">
            <CardHeader>
                <CardTitle className="text-lg">Upcoming Restock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {restockData.length === 0 && (
                    <p className="text-sm text-muted-foreground">No urgent restocks needed.</p>
                )}
                {restockData.map((data, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors border border-transparent hover:border-border">
                        <div className={`p-2.5 rounded-lg ${data.iconBg}`}>
                            <data.icon className={`w-5 h-5 ${data.iconColor}`} />
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-semibold">{data.item}</p>
                            <div className="flex items-center text-xs text-muted-foreground">
                                <CalendarClock className="w-3 h-3 mr-1" /> {data.date}
                            </div>
                        </div>
                        <div className="text-sm font-bold bg-secondary px-2.5 py-1 rounded-md max-w-[120px] truncate" title={data.qtyNeeded}>
                            {data.qtyNeeded}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

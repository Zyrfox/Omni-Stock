"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, Package, AlertTriangle } from "lucide-react";

interface RestockItem {
    nama_bahan: string;
    current_stock: number;
    satuan: string;
    daily_velocity: string;
    days_remaining: string;
    batas_minimum: number;
    vendor_id: string | null;
}

export function UpcomingRestock() {
    const [restockData, setRestockData] = useState<RestockItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRestock() {
            try {
                const res = await fetch("/api/inventory/restock-prediction");
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setRestockData(data.slice(0, 6));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch upcoming restocks", error);
            } finally {
                setLoading(false);
            }
        }
        fetchRestock();
    }, []);

    const getUrgencyColor = (days: string) => {
        const d = parseFloat(days);
        if (isNaN(d) || d <= 1) return "bg-red-500/15 text-red-500";
        if (d <= 3) return "bg-amber-500/15 text-amber-500";
        return "bg-blue-500/15 text-blue-500";
    };

    const getUrgencyIcon = (days: string) => {
        const d = parseFloat(days);
        if (isNaN(d) || d <= 1) return AlertTriangle;
        return Package;
    };

    return (
        <Card className="h-full border-white/10 dark:border-white/5">
            <CardHeader>
                <CardTitle className="text-lg">Upcoming Restock Needed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {loading && (
                    <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
                )}
                {!loading && restockData.length === 0 && (
                    <p className="text-sm text-muted-foreground">✅ All stock levels are healthy.</p>
                )}
                {restockData.map((item, index) => {
                    const Icon = getUrgencyIcon(item.days_remaining);
                    const urgencyClass = getUrgencyColor(item.days_remaining);
                    return (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors border border-transparent hover:border-border">
                            <div className={`p-2 rounded-lg ${urgencyClass}`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{item.nama_bahan}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{item.current_stock} {item.satuan}</span>
                                    <span>·</span>
                                    <span className="flex items-center">
                                        <CalendarClock className="w-3 h-3 mr-1" />
                                        {item.days_remaining === '∞' ? 'No usage data' : `${item.days_remaining} hari lagi`}
                                    </span>
                                </div>
                            </div>
                            <div className={`text-xs font-bold px-2 py-1 rounded-md ${urgencyClass}`}>
                                {parseFloat(item.days_remaining) <= 1 ? 'URGENT' : parseFloat(item.days_remaining) <= 3 ? 'LOW' : 'WATCH'}
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

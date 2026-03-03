"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StockLevel() {
    const [stockData, setStockData] = useState<any[]>([]);

    useEffect(() => {
        async function fetchStock() {
            try {
                const res = await fetch("/api/inventory/status");
                if (res.ok) {
                    const data = await res.json();

                    // Map to expected UI format
                    const formatted = data.map((item: any) => ({
                        name: item.nama_bahan,
                        remaining: item.current_stock,
                        minStock: item.batas_minimum,
                        maxStock: item.batas_minimum * 5 > item.current_stock ? item.batas_minimum * 5 : item.current_stock * 2,
                        satuan: item.satuan
                    }));

                    // Sort by most critical: remaining / minStock ratio (lowest first)
                    formatted.sort((a: any, b: any) => (a.remaining / (a.minStock || 1)) - (b.remaining / (b.minStock || 1)));

                    // Limit to top 5 lowest
                    setStockData(formatted.slice(0, 5));
                }
            } catch (error) {
                console.error("Failed to fetch stock status", error);
            }
        }
        fetchStock();
    }, []);

    return (
        <Card className="h-full border-white/10 dark:border-white/5">
            <CardHeader>
                <CardTitle className="text-lg">Stock Level Warning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                {stockData.map((item, index) => {
                    const ratio = (item.remaining / item.maxStock) * 100;
                    const isWarning = item.remaining <= item.minStock;
                    const isDanger = item.remaining <= item.minStock * 0.5;

                    let colorClass = "bg-emerald-500";
                    if (isDanger) colorClass = "bg-destructive";
                    else if (isWarning) colorClass = "bg-amber-500";

                    return (
                        <div key={index} className="space-y-1.5">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-medium text-foreground">{item.name}</span>
                                <span className={cn("font-bold", isDanger ? "text-destructive" : isWarning ? "text-amber-500" : "text-muted-foreground")}>
                                    {item.remaining.toFixed(1)} <span className="text-xs font-normal">/ {item.minStock} {item.satuan} min</span>
                                </span>
                            </div>
                            <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-500", colorClass)}
                                    style={{ width: `${Math.min(ratio, 100)}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

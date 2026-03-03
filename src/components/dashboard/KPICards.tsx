"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Package, CheckCircle2, AlertTriangle, XCircle, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function KPICards() {
    const [stats, setStats] = useState({
        total_products: 0,
        available_stocks: 0,
        low_stocks: 0,
        out_of_stocks: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchKPI() {
            try {
                const res = await fetch("/api/dashboard/kpi");
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch KPI", error);
            } finally {
                setLoading(false);
            }
        }
        fetchKPI();
    }, []);

    const kpiData = [
        {
            title: "Total Products",
            value: loading ? "..." : stats.total_products.toLocaleString(),
            trend: "+12.5%",
            isPositive: true,
            icon: Package,
            colorClass: "text-primary",
            bgClass: "bg-primary/10",
        },
        {
            title: "Available Stocks",
            value: loading ? "..." : stats.available_stocks.toLocaleString(),
            trend: "+4.2%",
            isPositive: true,
            icon: CheckCircle2,
            colorClass: "text-emerald-500",
            bgClass: "bg-emerald-500/10",
        },
        {
            title: "Low Stocks",
            value: loading ? "..." : stats.low_stocks.toLocaleString(),
            trend: "-1.5%",
            isPositive: false,
            icon: AlertTriangle,
            colorClass: "text-amber-500",
            bgClass: "bg-amber-500/10",
        },
        {
            title: "Out of Stocks",
            value: loading ? "..." : stats.out_of_stocks.toLocaleString(),
            trend: "+2.4%",
            isPositive: false,
            icon: XCircle,
            colorClass: "text-destructive",
            bgClass: "bg-destructive/10",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {kpiData.map((kpi, index) => (
                <Card key={index} className="shadow-sm border-white/10 dark:border-white/5 transition-all duration-300 hover:shadow-md hover:-translate-y-1 overflow-hidden">
                    <CardContent className="relative p-5">
                        {/* Icon — pinned top-right */}
                        <div className={cn("absolute top-4 right-4 p-2.5 rounded-xl", kpi.bgClass)}>
                            <kpi.icon className={cn("w-5 h-5", kpi.colorClass)} />
                        </div>

                        {/* Text content — flows independently on the left */}
                        <div className="space-y-2 pr-14">
                            <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                            <h3 className="text-3xl font-bold tracking-tight">{kpi.value}</h3>
                        </div>

                        <div className="mt-4 flex items-center gap-1.5 text-sm">
                            <span className={cn("flex items-center font-medium", kpi.isPositive ? "text-emerald-500" : "text-destructive")}>
                                {kpi.isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                                {kpi.trend}
                            </span>
                            <span className="text-muted-foreground ml-1">vs last month</span>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

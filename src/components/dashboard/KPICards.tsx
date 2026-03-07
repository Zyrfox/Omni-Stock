"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Package, CheckCircle2, AlertTriangle, XCircle, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function KPICards() {
    const [stats, setStats] = useState({
        total_products: { value: 0, trend: "0%", isPositive: true },
        available_stocks: { value: 0, trend: "0%", isPositive: true },
        low_stocks: { value: 0, trend: "0%", isPositive: true },
        out_of_stocks: { value: 0, trend: "0%", isPositive: true },
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
            value: loading ? "..." : stats.total_products.value.toLocaleString(),
            trend: stats.total_products.trend,
            isPositive: stats.total_products.isPositive,
            icon: Package,
            colorClass: "text-primary",
            bgClass: "bg-primary/10",
        },
        {
            title: "Available Stocks",
            value: loading ? "..." : stats.available_stocks.value.toLocaleString(),
            trend: stats.available_stocks.trend,
            isPositive: stats.available_stocks.isPositive,
            icon: CheckCircle2,
            colorClass: "text-emerald-500",
            bgClass: "bg-emerald-500/10",
        },
        {
            title: "Low Stocks",
            value: loading ? "..." : stats.low_stocks.value.toLocaleString(),
            trend: stats.low_stocks.trend,
            isPositive: stats.low_stocks.isPositive,
            icon: AlertTriangle,
            colorClass: "text-amber-500",
            bgClass: "bg-amber-500/10",
        },
        {
            title: "Out of Stocks",
            value: loading ? "..." : stats.out_of_stocks.value.toLocaleString(),
            trend: stats.out_of_stocks.trend,
            isPositive: stats.out_of_stocks.isPositive,
            icon: XCircle,
            colorClass: "text-destructive",
            bgClass: "bg-destructive/10",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {kpiData.map((kpi, index) => (
                <motion.div
                    key={index}
                    whileHover="hover"
                    initial="initial"
                    className="h-full"
                >
                    <Card className="h-full shadow-sm border-white/10 dark:border-white/5 transition-all duration-300 hover:shadow-md hover:border-primary/20 overflow-hidden relative group">
                        <CardContent className="p-5 flex flex-col justify-between h-full min-h-[140px] space-y-4">
                            {/* Header Card: Label kiri, Icon kanan */}
                            <div className="flex justify-between items-start w-full">
                                <p className="text-sm font-medium text-gray-400">{kpi.title}</p>
                                <motion.div
                                    className={cn("p-2.5 rounded-xl flex items-center justify-center shrink-0", kpi.bgClass)}
                                    variants={{
                                        initial: { scale: 1, rotate: 0 },
                                        hover: { scale: 1.05, rotate: [0, -5, 5, 0], transition: { duration: 0.3 } }
                                    }}
                                >
                                    <kpi.icon className={cn("w-5 h-5", kpi.colorClass)} />
                                </motion.div>
                            </div>

                            {/* Body Card: Angka Utama */}
                            <div>
                                <h3 className="text-3xl font-bold tracking-tight">{kpi.value}</h3>
                            </div>

                            {/* Footer Card: Persentase trend sejajar vertikal di bawah angka */}
                            <div className="flex flex-col text-xs space-y-1">
                                <span className={cn("flex items-center font-medium", kpi.isPositive ? "text-emerald-500" : "text-destructive")}>
                                    {kpi.isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                    {kpi.trend}
                                </span>
                                <span className="text-gray-500">vs last day</span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}

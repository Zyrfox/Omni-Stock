"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const formatIDR = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value);
};

export function ProfitChart() {
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        async function fetchProfit() {
            try {
                const res = await fetch("/api/dashboard/profit");
                if (res.ok) {
                    const result = await res.json();
                    if (result.profits) {
                        // Calculate total to derive percentage
                        const total = result.profits.reduce((acc: number, curr: any) => acc + curr.value, 0);
                        const mapped = result.profits.map((p: any) => ({
                            ...p,
                            percentage: total > 0 ? Math.round((p.value / total) * 100) : 0
                        }));
                        setData(mapped);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch profit data", error);
            }
        }
        fetchProfit();
    }, []);

    return (
        <Card className="h-full border-white/10 dark:border-white/5 flex flex-col">
            <CardHeader>
                <CardTitle className="text-lg">Profit by Category</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: any) => formatIDR(value)}
                                contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    borderRadius: "8px",
                                    border: "1px solid hsl(var(--border))",
                                    fontWeight: 500
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                    {data.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: item.color }}
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">{item.name}</span>
                                <span className="text-xs text-muted-foreground">{item.percentage}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

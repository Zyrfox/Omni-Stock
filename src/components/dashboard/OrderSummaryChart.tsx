"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function OrderSummaryChart() {
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        async function fetchOrderSummary() {
            try {
                const res = await fetch("/api/dashboard/order-summary?days=7");
                if (res.ok) {
                    const rawData = await res.json();
                    const formatted = rawData.map((d: any) => ({
                        name: d.date.split('-').slice(1).join('/'), // Convert YYYY-MM-DD to MM/DD
                        orders: d.total_orders
                    }));
                    setData(formatted);
                }
            } catch (error) {
                console.error("Failed to fetch order summary", error);
            }
        }
        fetchOrderSummary();
    }, []);

    return (
        <Card className="h-full border-white/10 dark:border-white/5">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-lg">Order Summary</CardTitle>
                        <CardDescription>Weekly order performance</CardDescription>
                    </div>
                    <select className="bg-secondary/50 text-sm rounded-lg px-2 py-1 text-secondary-foreground border-none outline-none focus:ring-1 focus:ring-primary">
                        <option>This Week</option>
                        <option>Last Week</option>
                    </select>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[280px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#D4FF00" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#D4FF00" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    borderRadius: "8px",
                                    border: "1px solid hsl(var(--border))",
                                    fontWeight: 500,
                                    color: "hsl(var(--foreground))"
                                }}
                                itemStyle={{ color: "hsl(var(--foreground))" }}
                            />
                            <Area
                                type="monotone"
                                dataKey="orders"
                                stroke="#D4FF00"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorOrders)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

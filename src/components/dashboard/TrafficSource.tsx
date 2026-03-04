"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

export function TrafficSource() {
    // Keeping the original name for backward compatibility in imports, but changing rendering context
    const [movementData, setMovementData] = useState<any[]>([]);
    const { resolvedTheme } = useTheme();
    const tickColor = resolvedTheme === 'dark' ? '#9CA3AF' : '#4B5563';

    useEffect(() => {
        async function fetchStockMovement() {
            try {
                const res = await fetch("/api/dashboard/stock-movement");
                if (res.ok) {
                    const data = await res.json();
                    setMovementData(data);
                }
            } catch (error) {
                console.error("Failed to fetch stock movement", error);
            }
        }
        fetchStockMovement();
    }, []);

    return (
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-white/10 dark:border-white/5 h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Stock Movement Summary</CardTitle>
                <CardDescription>Pergerakan stok harian: Masuk, Keluar, dan Penyesuaian.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[280px] w-full mt-4">
                    {movementData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                            Memuat data pergerakan stok...
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={movementData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12, fill: tickColor }}
                                    dy={10}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12, fill: tickColor }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
                                    itemStyle={{ fontSize: '12px' }}
                                    labelStyle={{ fontSize: '13px', fontWeight: 'bold', color: 'hsl(var(--foreground))', marginBottom: '4px' }}
                                />
                                <Legend
                                    verticalAlign="top"
                                    height={36}
                                    wrapperStyle={{ fontSize: '12px', paddingTop: '4px' }}
                                    iconType="circle"
                                />
                                <Line
                                    name="Stok Masuk"
                                    type="monotone"
                                    dataKey="masuk"
                                    stroke="#10b981" // emerald-500
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    name="Stok Keluar"
                                    type="monotone"
                                    dataKey="keluar"
                                    stroke="#ef4444" // red-500
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    name="Penyesuaian"
                                    type="monotone"
                                    dataKey="penyesuaian"
                                    stroke="#eab308" // yellow-500
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                    strokeDasharray="5 5"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

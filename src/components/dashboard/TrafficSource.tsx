"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

export function TrafficSource() {
    const [trafficSources, setTrafficSources] = useState<any[]>([]);

    useEffect(() => {
        async function fetchTraffic() {
            try {
                const res = await fetch("/api/dashboard/traffic-source");
                if (res.ok) {
                    const data = await res.json();
                    setTrafficSources(data);
                }
            } catch (error) {
                console.error("Failed to fetch traffic sources", error);
            }
        }
        fetchTraffic();
    }, []);

    return (
        <Card className="h-full border-white/10 dark:border-white/5">
            <CardHeader>
                <CardTitle className="text-lg">Traffic Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {trafficSources.length === 0 && (
                    <p className="text-sm text-muted-foreground">No traffic data.</p>
                )}
                {trafficSources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between">
                        <div className="space-y-1 w-24">
                            <p className="text-sm font-semibold">{source.name}</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold">{source.total}</span>
                            </div>
                        </div>

                        <div className="h-10 flex-1 px-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={source.data}>
                                    <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke={source.color}
                                        strokeWidth={2}
                                        dot={false}
                                        isAnimationActive={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className={`text-xs font-medium ${source.trend?.startsWith('+') ? 'text-emerald-500' : 'text-amber-500'} w-12 text-right`}>
                            {source.trend || ""}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

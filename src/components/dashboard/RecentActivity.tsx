"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RecentActivity() {
    const [activities, setActivities] = useState<{ user: string, action: string, time: string, avatar: string, color: string }[]>([]);

    useEffect(() => {
        async function fetchActivity() {
            try {
                const res = await fetch("/api/dashboard/recent-activity");
                if (res.ok) {
                    const data = await res.json();

                    const formatted = data.map((item: { timestamp: string, user: string, action: string }) => {
                        const date = new Date(item.timestamp);
                        const isSystem = item.user.toLowerCase() === 'system';

                        return {
                            user: item.user,
                            action: item.action,
                            time: date.toLocaleString(), // Simple format for now
                            avatar: isSystem ? "Sys" : item.user.substring(0, 2).toUpperCase(),
                            color: isSystem ? "bg-amber-500" : "bg-emerald-500"
                        };
                    });

                    setActivities(formatted);
                }
            } catch (error) {
                console.error("Failed to fetch recent activity", error);
            }
        }
        fetchActivity();
    }, []);

    return (
        <Card className="h-full border-white/10 dark:border-white/5">
            <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                {activities.length === 0 && (
                    <p className="text-sm text-muted-foreground">No recent activity.</p>
                )}
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:to-transparent">
                    {activities.map((activity, index) => (
                        <div key={index} className="relative flex items-start gap-4 mb-4 group">
                            <div className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-xs text-white shadow-sm ring-4 ring-card ${activity.color}`}>
                                {activity.avatar}
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm">
                                    <span className="font-semibold text-foreground">{activity.user}</span>{" "}
                                    <span className="text-muted-foreground">{activity.action}</span>
                                </p>
                                <div className="text-xs text-muted-foreground font-medium">
                                    {activity.time}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

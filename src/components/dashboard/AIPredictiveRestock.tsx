"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { Sparkles, TrendingDown, Clock, Loader2 } from "lucide-react"
import Link from "next/link"

type Prediction = {
    bahan_id: string;
    nama_bahan: string;
    current_stock: number;
    satuan: string;
    days_left: number;
    confidence: number;
    suggested_qty: number;
}

export function AIPredictiveRestock() {
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPredictions() {
            try {
                const res = await fetch('/api/dashboard/predict-stock');
                const data = await res.json();
                if (data.predictions) {
                    setPredictions(data.predictions);
                }
            } catch (err) {
                console.error("Failed to fetch AI predictions", err);
            } finally {
                setLoading(false);
            }
        }

        // Simulating a slightly longer load time for the "AI" feel
        const timer = setTimeout(() => {
            fetchPredictions();
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    return (
        <Card className="h-full border-indigo-500/20 shadow-lg relative overflow-hidden bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Sparkles className="h-24 w-24 text-indigo-500" />
            </div>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> AI Predictive Restock
                </CardTitle>
                <CardDescription>Estimasi stok habis berdasarkan tren</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                        <p className="text-sm font-medium text-indigo-600/70 animate-pulse">Omni-AI is analyzing stock velocity...</p>
                    </div>
                ) : predictions.length > 0 ? (
                    <div className="space-y-4 mt-2">
                        {predictions.slice(0, 5).map((p, idx) => (
                            <div key={idx} className="flex flex-col gap-2 p-3 rounded-lg bg-background/80 border border-indigo-500/10 hover:border-indigo-500/30 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="font-semibold text-sm leading-tight text-foreground truncate pl-1 border-l-2 border-indigo-500 w-3/4" title={p.nama_bahan}>
                                        {p.nama_bahan}
                                    </div>
                                    <div className="text-xs font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 whitespace-nowrap">
                                        {p.confidence}% Akurat
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 p-1.5 rounded">
                                        <Clock className="h-3.5 w-3.5 text-rose-500" />
                                        <span>Habis dalam <strong className="text-foreground">{p.days_left} hari</strong></span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 p-1.5 rounded">
                                        <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
                                        <span>Order <strong className="text-foreground">{p.suggested_qty} {p.satuan}</strong></span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {predictions.length > 5 && (
                            <div className="pt-2 border-t border-indigo-500/10 text-center">
                                <Link href="/products" className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline">
                                    Lihat Semua ({predictions.length})
                                </Link>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center h-32">
                        <p className="text-sm font-medium">Data Tidak Cukup</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Belum ada data historis yang memadai untuk membuat prediksi AI.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

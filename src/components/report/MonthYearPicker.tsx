"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

export function MonthYearPicker() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const selectedMonth = searchParams.get("month") || currentMonth.toString();
    const selectedYear = searchParams.get("year") || currentYear.toString();

    const handleMonthChange = (val: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("month", val);
        params.set("year", selectedYear);
        router.push(`?${params.toString()}`);
    };

    const handleYearChange = (val: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("month", selectedMonth);
        params.set("year", val);
        router.push(`?${params.toString()}`);
    };

    const handleExport = () => {
        // Dummy export for now
        toast.success("Laporan PDF sedang digenerate...");
        setTimeout(() => toast.success("Berhasil diunduh!"), 2000);
    };

    const months = [
        { value: "1", label: "Januari" }, { value: "2", label: "Februari" },
        { value: "3", label: "Maret" }, { value: "4", label: "April" },
        { value: "5", label: "Mei" }, { value: "6", label: "Juni" },
        { value: "7", label: "Juli" }, { value: "8", label: "Agustus" },
        { value: "9", label: "September" }, { value: "10", label: "Oktober" },
        { value: "11", label: "November" }, { value: "12", label: "Desember" }
    ];

    const years = ["2024", "2025", "2026", "2027"];

    return (
        <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[140px] bg-background">
                    <SelectValue placeholder="Bulan" />
                </SelectTrigger>
                <SelectContent>
                    {months.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[100px] bg-background">
                    <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                    {years.map(y => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Button onClick={handleExport} className="ml-2 gap-2" variant="outline">
                <Download className="h-4 w-4" /> Export Laporan
            </Button>
        </div>
    );
}

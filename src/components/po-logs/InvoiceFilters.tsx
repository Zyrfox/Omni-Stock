"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface InvoiceFiltersProps {
    vendors: string[];
}

export function InvoiceFilters({ vendors }: InvoiceFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentStatus = searchParams.get("status") || "ALL";
    const currentVendor = searchParams.get("vendor") || "ALL";

    // Create a query string with updated parameters
    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value === "ALL") {
                params.delete(name);
            } else {
                params.set(name, value);
            }
            return params.toString();
        },
        [searchParams]
    );

    const handleStatusChange = (value: string) => {
        router.push(pathname + "?" + createQueryString("status", value));
    };

    const handleVendorChange = (value: string) => {
        router.push(pathname + "?" + createQueryString("vendor", value));
    };

    const handleReset = () => {
        router.push(pathname);
    };

    const hasFilters = currentStatus !== "ALL" || currentVendor !== "ALL";

    return (
        <div className="flex flex-col sm:flex-row items-end gap-4 mb-4">
            <div className="space-y-2 w-full sm:w-[200px]">
                <Label htmlFor="status-filter">Filter Status</Label>
                <Select value={currentStatus} onValueChange={handleStatusChange}>
                    <SelectTrigger id="status-filter" className="w-full bg-background">
                        <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Semua Status</SelectItem>
                        <SelectItem value="DRAFT">DRAFT</SelectItem>
                        <SelectItem value="APPROVED">APPROVED</SelectItem>
                        <SelectItem value="PAID">LUNAS (PAID)</SelectItem>
                        <SelectItem value="UNPAID">BELUM LUNAS (UNPAID)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2 w-full sm:w-[250px]">
                <Label htmlFor="vendor-filter">Filter Vendor</Label>
                <Select value={currentVendor} onValueChange={handleVendorChange}>
                    <SelectTrigger id="vendor-filter" className="w-full bg-background">
                        <SelectValue placeholder="Semua Vendor" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Semua Vendor</SelectItem>
                        {vendors.map((vendor) => (
                            <SelectItem key={vendor} value={vendor}>
                                {vendor}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {hasFilters && (
                <Button
                    variant="ghost"
                    onClick={handleReset}
                    className="text-muted-foreground hover:text-foreground h-10 px-3"
                >
                    <X className="h-4 w-4 mr-2" />
                    Reset
                </Button>
            )}
        </div>
    );
}

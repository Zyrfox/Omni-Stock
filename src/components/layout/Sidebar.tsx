"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Store,
    Package,
    Tags,
    Truck,
    Receipt,
    ShoppingCart,
    MapPin,
    BarChart,
    Settings,
    CircleHelp,
    LogOut,
    Package2,
    Menu,
    ChevronLeft,
    ClipboardList,
    X
} from "lucide-react";

interface SidebarProps {
    isOpen: boolean;
    toggle: () => void;
}

const groups = [
    {
        label: "DISCOVER",
        items: [
            { name: "Dashboard", href: "/", icon: LayoutDashboard },
            { name: "Stores", href: "/stores", icon: Store },
        ]
    },
    {
        label: "INVENTORY",
        items: [
            { name: "Products", href: "/products", icon: Package },
            { name: "Category", href: "/category", icon: Tags },
            { name: "Suppliers", href: "/suppliers", icon: Truck },
            { name: "Billing", href: "/billing", icon: Receipt },
            { name: "Upload History", href: "/orders", icon: ShoppingCart },
            { name: "PO Logs", href: "/po-logs", icon: ClipboardList },
            { name: "Delivery", href: "/delivery", icon: MapPin },
            { name: "Report", href: "/report", icon: BarChart },
        ]
    },
    {
        label: "SETTINGS",
        items: [
            { name: "Settings", href: "/settings", icon: Settings },
            { name: "Help", href: "/help", icon: CircleHelp },
            { name: "Logout", href: "/logout", icon: LogOut, textClass: "text-destructive font-semibold", iconClass: "text-destructive" },
        ]
    }
];

export function Sidebar({ isOpen, toggle }: SidebarProps) {
    const pathname = usePathname();

    return (
        <div className="flex h-full flex-col font-medium text-sm">
            {/* Header */}
            <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-border">
                <div className={cn("flex items-center gap-2 overflow-hidden transition-all duration-300", isOpen ? "w-auto opacity-100" : "w-0 opacity-0")}>
                    <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
                        <Package2 className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-lg tracking-tight whitespace-nowrap">OMNI-STOCK</span>
                </div>
                <button onClick={toggle} className="p-2 hover:bg-secondary rounded-lg transition-colors text-sidebar-foreground" aria-label="Toggle Sidebar">
                    {isOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 custom-scrollbar">
                {groups.map((group, i) => (
                    <div key={i} className="flex flex-col gap-1">
                        {isOpen && (
                            <span className="px-3 text-xs font-semibold text-secondary-foreground uppercase tracking-wider mb-2 transition-all">
                                {group.label}
                            </span>
                        )}
                        {group.items.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-secondary-foreground hover:bg-secondary hover:text-foreground",
                                        !isOpen && "justify-center"
                                    )}
                                    title={!isOpen ? item.name : undefined}
                                >
                                    <item.icon className={cn("h-5 w-5 shrink-0", item.iconClass, isActive ? "text-primary-foreground" : "")} />
                                    {isOpen && (
                                        <span className={cn("whitespace-nowrap transition-all duration-300", item.textClass)}>
                                            {item.name}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>
        </div>
    );
}

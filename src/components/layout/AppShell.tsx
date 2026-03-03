"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const pathname = usePathname();

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Auto-close sidebar on mobile when navigating
    useEffect(() => {
        if (isMobile) setIsSidebarOpen(false);
    }, [pathname, isMobile]);

    return (
        <div className="h-screen w-full bg-background overflow-hidden">
            {/* Mobile overlay backdrop */}
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 h-full z-50 bg-sidebar border-r border-border transition-all duration-300",
                    isMobile
                        ? (isSidebarOpen ? "w-[260px] translate-x-0" : "w-[260px] -translate-x-full")
                        : (isSidebarOpen ? "w-[260px]" : "w-[80px]")
                )}
            >
                <Sidebar isOpen={isSidebarOpen || isMobile} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />
            </aside>

            {/* Main content — offset by sidebar width on desktop */}
            <div
                className={cn(
                    "flex flex-col h-full transition-all duration-300",
                    isMobile
                        ? "ml-0"
                        : (isSidebarOpen ? "ml-[260px]" : "ml-[80px]")
                )}
            >
                <Header
                    onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    isMobile={isMobile}
                />
                <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

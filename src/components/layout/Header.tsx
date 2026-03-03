"use client";

import { usePathname } from "next/navigation";
import { Search, Sun, Moon, Bell, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

interface HeaderProps {
    onMenuClick?: () => void;
    isMobile?: boolean;
}

export function Header({ onMenuClick, isMobile }: HeaderProps) {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const title = pathname === "/" ? "Dashboard" :
        pathname.split("/").pop()?.replace("-", " ");
    const formattedTitle = title ? title.charAt(0).toUpperCase() + title.slice(1) : "";

    return (
        <header className="flex h-14 md:h-16 shrink-0 items-center justify-between border-b border-border bg-card px-3 md:px-6">
            <div className="flex items-center gap-3">
                {/* Hamburger menu — hanya tampil di mobile */}
                {isMobile && (
                    <Button variant="ghost" size="icon" onClick={onMenuClick} className="md:hidden h-9 w-9">
                        <Menu className="h-5 w-5" />
                    </Button>
                )}
                <h1 className="text-lg md:text-xl font-bold text-foreground truncate">
                    {formattedTitle}
                </h1>
            </div>

            <div className="flex items-center gap-1 md:gap-3">
                {/* Search bar — hidden on mobile */}
                <div className="relative hidden md:flex items-center w-48 lg:w-80">
                    <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search global..."
                        className="pl-9 bg-secondary/70 border-none focus-visible:ring-primary rounded-xl"
                    />
                </div>

                {mounted ? (
                    <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full text-secondary-foreground h-9 w-9">
                        {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    </Button>
                ) : (
                    <div className="w-9 h-9" />
                )}

                <Button variant="ghost" size="icon" className="relative rounded-full text-secondary-foreground h-9 w-9">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-destructive border-2 border-card"></span>
                </Button>

                <div className="flex items-center gap-2 pl-2 md:pl-4 border-l border-border">
                    <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground text-xs md:text-sm">
                        SA
                    </div>
                    <div className="hidden md:flex flex-col text-sm">
                        <span className="font-semibold leading-none">Super Admin</span>
                        <span className="text-[10px] text-muted-foreground mt-1">super@omni.com</span>
                    </div>
                </div>
            </div>
        </header>
    );
}

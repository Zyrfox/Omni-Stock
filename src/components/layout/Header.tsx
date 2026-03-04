"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Sun, Moon, Bell, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

import { CommandPalette } from "./CommandPalette";

interface HeaderProps {
    onMenuClick?: () => void;
    isMobile?: boolean;
}

export function Header({ onMenuClick, isMobile }: HeaderProps) {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Register Push Notification Service Worker
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.register('/push-sw.js')
                .then(() => console.log('Push SW registered successfully.'))
                .catch(err => console.error('Push SW registration failed:', err));
        }
    }, []);

    const title = pathname === "/" ? "Dashboard" :
        pathname.split("/").pop()?.replace("-", " ");
    const formattedTitle = title ? title.charAt(0).toUpperCase() + title.slice(1) : "";

    // Mock Notifications data
    const notifications = [
        { id: 1, title: 'Draft PO Dibuat', time: '5m ago', read: false, href: '/po-logs' },
        { id: 2, title: 'Stok Maizena Habis!', time: '1h ago', read: false, href: '/products' },
        { id: 3, title: 'Upload Berhasil', time: '2h ago', read: true, href: '/' }
    ];
    const unreadCount = notifications.filter(n => !n.read).length;

    // Helper: resolve notification route from title
    function getNotifHref(n: typeof notifications[0]) {
        if (n.href) return n.href;
        if (n.title.includes('Draft PO')) return '/po-logs';
        if (n.title.includes('Stok') && n.title.includes('Habis')) return '/products';
        return '/';
    }

    return (
        <>
            <CommandPalette />
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
                    <div
                        className="relative hidden md:flex items-center w-48 lg:w-80 cursor-pointer group"
                        onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
                    >
                        <Search className="absolute left-3 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <div className="flex items-center justify-between w-full pl-9 pr-3 h-9 bg-secondary/70 border-none rounded-xl text-sm text-muted-foreground hover:bg-secondary transition-colors">
                            <span>Search global...</span>
                            <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                        </div>
                    </div>

                    {mounted ? (
                        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full text-secondary-foreground h-9 w-9">
                            {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                        </Button>
                    ) : (
                        <div className="w-9 h-9" />
                    )}

                    {/* Notification Bell with Dropdown */}
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative rounded-full text-secondary-foreground h-9 w-9"
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-destructive border-2 border-card"></span>
                            )}
                        </Button>

                        {showNotifications && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                                <div className="absolute right-0 mt-2 w-72 bg-card border border-border shadow-lg rounded-xl z-50 overflow-hidden animate-in slide-in-from-top-2">
                                    <div className="px-4 py-3 border-b border-border bg-muted/50 flex justify-between items-center">
                                        <span className="font-semibold text-sm text-foreground">Notifications</span>
                                        <span className="text-xs text-lime-700 dark:text-lime-400 cursor-pointer hover:underline">Mark all as read</span>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.map(n => (
                                            <Link
                                                key={n.id}
                                                href={getNotifHref(n)}
                                                onClick={() => setShowNotifications(false)}
                                                className={`block p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer ${!n.read ? 'bg-primary/5' : ''}`}
                                            >
                                                <div className="flex justify-between items-start gap-2">
                                                    <div>
                                                        <p className={`text-sm ${!n.read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                                                    </div>
                                                    {!n.read && <div className="h-2 w-2 rounded-full bg-lime-600 dark:bg-lime-400 mt-1.5 shrink-0" />}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

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
        </>
    );
}

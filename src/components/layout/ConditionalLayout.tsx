"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "./AppShell";

// Auth-only routes that should render WITHOUT any dashboard chrome
const AUTH_ROUTES = ["/login"];

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

    // Auth pages: render full-screen, no Sidebar/Header
    if (isAuthRoute) {
        return <>{children}</>;
    }

    // Dashboard pages: wrap with AppShell (Sidebar + Header)
    return <AppShell>{children}</AppShell>;
}

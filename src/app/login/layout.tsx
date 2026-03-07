import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login | OMNI-STOCK",
    description: "Sign in to OMNI-STOCK",
};

// Standalone layout for the login page — no Sidebar, no Header
export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return children;
}

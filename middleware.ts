import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const { nextUrl, auth: session } = req;
    const isLoggedIn = !!session;

    const isAuthPage = nextUrl.pathname.startsWith("/login");
    const isApiAuth = nextUrl.pathname.startsWith("/api/auth");

    // Allow access to auth-related pages and API routes
    if (isApiAuth) return NextResponse.next();

    // Redirect logged-in users away from login page
    if (isLoggedIn && isAuthPage) {
        return NextResponse.redirect(new URL("/", nextUrl));
    }

    // Redirect unauthenticated users to login page
    if (!isLoggedIn && !isAuthPage) {
        const redirectUrl = new URL("/login", nextUrl);
        redirectUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        // Match all paths except static files and Next.js internals
        "/((?!_next/static|_next/image|favicon.ico|logo.svg|push-sw.js).*)",
    ],
};

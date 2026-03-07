"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Suspense } from "react";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Email atau password salah. Silakan coba lagi.");
            } else {
                router.push(callbackUrl);
                router.refresh();
            }
        } catch {
            setError("Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email
                </Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="admin@omni.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="h-11 bg-secondary/50 border-border focus:border-primary transition-colors"
                    disabled={isLoading}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                </Label>
                <div className="relative">
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="h-11 bg-secondary/50 border-border focus:border-primary transition-colors pr-10"
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            <Button
                type="submit"
                className="w-full h-11 font-semibold gap-2"
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Masuk...
                    </>
                ) : (
                    <>
                        <LogIn className="h-4 w-4" />
                        Masuk ke Dashboard
                    </>
                )}
            </Button>
        </form>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
            {/* Background gradient blobs */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
            </div>

            <div className="relative w-full max-w-sm">
                {/* Card */}
                <div className="rounded-2xl border border-border bg-card shadow-xl p-8 space-y-8">
                    {/* Header */}
                    <div className="flex flex-col items-center gap-4 text-center">
                        <img
                            src="/logo.svg"
                            alt="Easy Going Group"
                            className="h-12 w-auto"
                        />
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Selamat Datang</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Masuk ke OMNI-STOCK Dashboard
                            </p>
                        </div>
                    </div>

                    {/* Role badge */}
                    <div className="flex items-center justify-center gap-2">
                        {["STAFF", "SPV", "MANAGER"].map((role) => (
                            <span
                                key={role}
                                className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
                            >
                                {role}
                            </span>
                        ))}
                    </div>

                    {/* Form */}
                    <Suspense fallback={null}>
                        <LoginForm />
                    </Suspense>

                    {/* Footer */}
                    <p className="text-center text-xs text-muted-foreground">
                        Easy Going Group &copy; {new Date().getFullYear()} · OMNI-STOCK
                    </p>
                </div>
            </div>
        </div>
    );
}

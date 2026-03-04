"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Search, Package, ShoppingCart, Store, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Toggle the menu when ⌘K is pressed or custom event
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        const openCustom = () => setOpen(true);

        document.addEventListener("keydown", down);
        window.addEventListener("open-command-palette", openCustom);
        return () => {
            document.removeEventListener("keydown", down);
            window.removeEventListener("open-command-palette", openCustom);
        };
    }, []);

    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                }
            } catch (error) {
                console.error("Search error", error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchResults, 300); // Debounce
        return () => clearTimeout(timer);
    }, [query]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] pb-[10vh] px-4 backdrop-blur-sm bg-black/50">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setOpen(false)} />

            <div className="relative w-full max-w-xl bg-card border border-border shadow-2xl rounded-xl overflow-hidden shadow-black/50 animate-in fade-in zoom-in-95 duration-200">
                <Command
                    className="w-full flex w-full flex-col bg-transparent"
                    shouldFilter={false} // We handle filtering on backend
                >
                    <div className="flex items-center border-b border-border px-4 py-3">
                        <Search className="mr-3 h-5 w-5 text-muted-foreground" />
                        <Command.Input
                            className="flex-1 bg-transparent border-none text-base outline-none placeholder:text-muted-foreground focus:ring-0 text-foreground"
                            placeholder="Type a command or search (e.g., 'stok keluar hari ini')..."
                            value={query}
                            onValueChange={setQuery}
                            autoFocus
                        />
                        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <Command.List className="max-h-[300px] overflow-y-auto p-2 scroll-pb-2 scroll-smooth">
                        {loading && <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>}

                        {!loading && query && results.length === 0 && (
                            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                                No results found for "{query}".
                            </Command.Empty>
                        )}

                        {!loading && results.length > 0 && (
                            <Command.Group heading="Top Results" className="text-xs font-medium text-muted-foreground px-2 py-1.5 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                                {results.map((result, i) => (
                                    <Command.Item
                                        key={i}
                                        value={result.id || result.title}
                                        onSelect={() => {
                                            if (result.url) {
                                                router.push(result.url);
                                                setOpen(false);
                                            }
                                        }}
                                        className={cn(
                                            "relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2.5 text-sm outline-none",
                                            "aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                            "hover:bg-accent hover:text-accent-foreground w-full"
                                        )}
                                    >
                                        <div className="mr-3 p-1.5 bg-secondary rounded-md">
                                            {result.type === 'product' && <Package className="h-4 w-4 text-cyan-500" />}
                                            {result.type === 'order' && <ShoppingCart className="h-4 w-4 text-emerald-500" />}
                                            {result.type === 'store' && <Store className="h-4 w-4 text-violet-500" />}
                                            {!['product', 'order', 'store'].includes(result.type) && <Search className="h-4 w-4 text-muted-foreground" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">{result.title}</span>
                                            {result.description && (
                                                <span className="text-xs text-muted-foreground line-clamp-1">{result.description}</span>
                                            )}
                                        </div>
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}

                        {!loading && results.length === 5 && (
                            <div className="px-2 py-2 border-t border-border mt-2">
                                <button className="w-full text-center text-xs text-primary hover:underline" onClick={() => {
                                    /* Handle full search page if exists */
                                    setOpen(false);
                                }}>
                                    Lihat semua hasil di halaman penuh
                                </button>
                            </div>
                        )}
                    </Command.List>
                </Command>
            </div>
        </div>
    );
}

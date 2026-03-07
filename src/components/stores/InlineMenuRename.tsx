"use client";

import { useState } from "react";
import { Edit2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function InlineMenuRename({ id, initialName, isManager }: { id: string; initialName: string; isManager: boolean }) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(initialName);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    async function handleSave() {
        if (!name.trim() || name === initialName) {
            setIsEditing(false);
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/menus/${id}/rename`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nama_menu: name })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Gagal menyimpan nama menu");
            }

            toast.success("Nama menu berhasil diperbarui");
            setIsEditing(false);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-7 text-sm px-2 w-48"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                        if (e.key === 'Escape') {
                            setName(initialName);
                            setIsEditing(false);
                        }
                    }}
                    disabled={isLoading}
                />
                <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600" onClick={handleSave} disabled={isLoading}>
                    <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" onClick={() => { setName(initialName); setIsEditing(false); }} disabled={isLoading}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 group">
            <span className="font-medium">{name}</span>
            {isManager && (
                <button
                    onClick={() => setIsEditing(true)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition-all rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                    title="Rename Menu"
                >
                    <Edit2 className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}

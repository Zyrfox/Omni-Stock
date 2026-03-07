"use client";

import { useEffect, useState } from "react";
import { Trash2, UserPlus, Shield, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface UserResponse {
    id: string;
    email: string;
    username: string;
    role: string;
    created_at: string;
}

export function UserManagementTable({ currentUser }: { currentUser: { id?: string, username?: string, role?: string } }) {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [open, setOpen] = useState(false);

    // Form State
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("STAFF");

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                toast.error("Gagal mengambil data pengguna");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/users/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, username, password, role }),
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                setOpen(false);
                fetchUsers(); // Refresh table
                // Reset form
                setEmail("");
                setUsername("");
                setPassword("");
                setRole("STAFF");
            } else {
                toast.error(data.error || "Gagal membuat pengguna");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) return;

        try {
            const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                fetchUsers();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Terjadi kesalahan saat menghapus pengguna");
        }
    };

    const roleColor: Record<string, string> = {
        MANAGER: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20",
        SPV: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
        STAFF: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20",
    };

    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                    <CardTitle>Daftar Akun OMNI-STOCK</CardTitle>
                    <CardDescription>Semua staf, supervisor, dan manajer yang terdaftar.</CardDescription>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary text-primary-foreground">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Tambah Pengguna
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                            <DialogDescription>
                                Buat kredensial akun untuk staf. Password akan di-hash dan tidak dapat dilihat.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Login</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        className="pl-9"
                                        placeholder="nama@omni.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username">Username (Tampilan)</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="username"
                                        required
                                        className="pl-9"
                                        placeholder="Nama Lengkap / Singkat"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password Default</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <p className="text-[10px] text-muted-foreground leading-tight">Berikan password ini ke staf, sarankan untuk menggantinya nanti.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Hak Akses (Role)</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="STAFF">STAFF (Inventory, PO, Produksi)</SelectItem>
                                        <SelectItem value="SPV">SPV (Approve PO, Void)</SelectItem>
                                        <SelectItem value="MANAGER">MANAGER (All + User Management)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting ? "Menyimpan..." : "Buat Akun"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-border">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground text-xs uppercase font-medium">
                            <tr>
                                <th className="px-4 py-3">Username / Email</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Terdaftar Sejak</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="h-24 text-center text-muted-foreground">Memuat data...</td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="h-24 text-center text-muted-foreground">Tidak ada pengguna ditemukan.</td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-foreground flex items-center gap-2">
                                                {user.username}
                                                {user.id === currentUser.id && (
                                                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider">Anda</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-0.5">{user.email}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className={`text-[10px] font-bold ${roleColor[user.role] || roleColor.STAFF}`}>
                                                {user.role === 'MANAGER' && <Shield className="h-3 w-3 mr-1" />}
                                                {user.role}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">
                                            {new Date(user.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDeleteUser(user.id)}
                                                disabled={user.id === currentUser.id}
                                                title={user.id === currentUser.id ? "Tidak dapat menghapus akun sendiri" : "Hapus Pengguna"}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

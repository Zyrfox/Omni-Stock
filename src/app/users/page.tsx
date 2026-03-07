import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserManagementTable } from "@/components/dashboard/UserManagementTable";

export default async function UsersPage() {
    const session = await auth();

    // Server-side guard: Only MANAGER can access
    if ((session?.user as { role?: string })?.role !== "MANAGER") {
        redirect("/");
    }

    return (
        <div className="flex flex-col gap-6 h-full">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Manajemen Pengguna</h2>
                <p className="text-muted-foreground text-sm max-w-2xl mt-1">
                    Kelola akses aplikasi untuk staf dan supervisor. Halaman ini hanya dapat diakses oleh manajer.
                </p>
            </div>
            <UserManagementTable currentUser={{ id: session?.user?.id || '', username: (session?.user as { username?: string })?.username || '', role: (session?.user as { role?: string })?.role || '' }} />
        </div>
    );
}

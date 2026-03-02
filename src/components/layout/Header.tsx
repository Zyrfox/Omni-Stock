import { User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-6 bg-white dark:bg-slate-950">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Kitchen Pulse
                </h1>
            </div>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5 text-slate-500" />
                </Button>
                <Button variant="ghost" size="icon">
                    <User className="h-5 w-5 text-slate-500" />
                </Button>
            </div>
        </header>
    );
}

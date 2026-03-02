import Link from 'next/link';
import { Home, Database, FileText, Settings, PackageOpen } from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Master Data', href: '/master-data', icon: Database },
    { name: 'PO Logs', href: '/po-logs', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
    return (
        <div className="flex h-full w-64 flex-col bg-slate-900 border-r border-slate-800 text-white">
            <div className="flex h-16 items-center px-6 border-b border-slate-800">
                <PackageOpen className="h-6 w-6 text-indigo-400 mr-2" />
                <span className="text-lg font-bold">OMNI-STOCK</span>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-800 hover:text-white"
                    >
                        <item.icon
                            className="mr-3 h-5 w-5 text-slate-400 group-hover:text-white"
                            aria-hidden="true"
                        />
                        {item.name}
                    </Link>
                ))}
            </nav>
        </div>
    );
}

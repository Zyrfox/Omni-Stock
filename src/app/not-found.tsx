import Link from "next/link";
import { PackageX } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center h-[80vh] w-full bg-background rounded-3xl border border-border mt-4 mx-4">
            <div className="flex flex-col items-center gap-6 text-center max-w-sm">
                <div className="bg-secondary p-4 rounded-2xl">
                    <PackageX className="w-12 h-12 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        Under Construction
                    </h2>
                    <p className="text-sm text-secondary-foreground">
                        This module is currently being built and is not yet available in this version.
                    </p>
                </div>

                <Link
                    href="/"
                    className="mt-4 px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
                >
                    Return to Dashboard
                </Link>
            </div>
        </div>
    );
}

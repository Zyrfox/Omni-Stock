import { KPICards } from "@/components/dashboard/KPICards";
import { InvoiceGenerator } from "@/components/dashboard/InvoiceGenerator";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ProductTable } from "@/components/dashboard/ProductTable";
import { DropzoneUploader } from "@/components/dashboard/DropzoneUploader";
import { LastSyncedBadge } from "@/components/ui/LastSyncedBadge";
import { Suspense } from "react";
import { TopContributor } from "@/components/dashboard/TopContributor";
import { AuditPengeluaran } from "@/components/dashboard/AuditPengeluaran";
import { SmartStockWarning } from "@/components/dashboard/SmartStockWarning";
import { AIPredictiveRestock } from "@/components/dashboard/AIPredictiveRestock";

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-4 md:gap-6 w-full pb-8">
      {/* Top Banner / Upload Area */}
      <DropzoneUploader />

      {/* Master KPI Panels */}
      <KPICards />

      {/* The 4 Analytics Pillars (V6.0) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Suspense fallback={<div className="h-64 bg-secondary/50 animate-pulse rounded-xl" />}>
          <TopContributor />
        </Suspense>

        <Suspense fallback={<div className="h-64 bg-secondary/50 animate-pulse rounded-xl" />}>
          <AuditPengeluaran />
        </Suspense>

        <Suspense fallback={<div className="h-64 bg-secondary/50 animate-pulse rounded-xl" />}>
          <SmartStockWarning />
        </Suspense>

        <AIPredictiveRestock />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6 w-full">
        {/* Left/Main Content (Span 8) */}
        <div className="xl:col-span-8 flex flex-col gap-4 md:gap-6">
          <Suspense fallback={null}>
            <LastSyncedBadge />
          </Suspense>
          <ProductTable />
        </div>

        {/* Right/Side Analytics Content (Span 4) */}
        <div className="xl:col-span-4 flex flex-col gap-4 md:gap-6">
          <InvoiceGenerator />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}

import { KPICards } from "@/components/dashboard/KPICards";
import { ProfitChart } from "@/components/dashboard/ProfitChart";
import { OrderSummaryChart } from "@/components/dashboard/OrderSummaryChart";
import { StockLevel } from "@/components/dashboard/StockLevel";
import { UpcomingRestock } from "@/components/dashboard/UpcomingRestock";
import { TrafficSource } from "@/components/dashboard/TrafficSource";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ProductTable } from "@/components/dashboard/ProductTable";
import { DropzoneUploader } from "@/components/dashboard/DropzoneUploader";
import { LastSyncedBadge } from "@/components/ui/LastSyncedBadge";
import { Suspense } from "react";

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6 w-full pb-8">
      {/* Left/Main Content (Span 8) */}
      <div className="xl:col-span-8 flex flex-col gap-4 md:gap-6">
        <DropzoneUploader />
        <KPICards />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <ProfitChart />
          <OrderSummaryChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <StockLevel />
          <UpcomingRestock />
        </div>

        <Suspense fallback={null}>
          <LastSyncedBadge />
        </Suspense>
        <ProductTable />
      </div>

      {/* Right/Side Analytics Content (Span 4) */}
      <div className="xl:col-span-4 flex flex-col gap-4 md:gap-6">
        <TrafficSource />
        <RecentActivity />
      </div>
    </div>
  );
}

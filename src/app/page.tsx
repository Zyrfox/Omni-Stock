import { UploadDropzone } from '@/components/dashboard/UploadDropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, TrendingDown, ClipboardList, CheckCircle2 } from 'lucide-react';
import { db } from '@/db';
import { salesReports, logPO } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export default async function Dashboard() {
  const recentUploads = await db.query.salesReports.findMany({
    orderBy: [desc(salesReports.id)],
    limit: 5
  });

  const parsedCount = recentUploads.filter(u => u.upload_status === 'parsed').length;

  const pendingPOs = await db.query.logPO.findMany({
    where: eq(logPO.status, 'draft')
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Dashboard</h2>
        <p className="text-slate-500 dark:text-slate-400">Overview of inventory tracking and upload status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reports Processed limit(5)</CardTitle>
            <ClipboardList className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parsedCount}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Recent records status</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPOs.length}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Items below minimum</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending PO Drafts</CardTitle>
            <Package className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPOs.length}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Awaiting Manager Approval</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <UploadDropzone />

        <Card>
          <CardHeader>
            <CardTitle>Recent Upload Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUploads.map((upload) => (
                  <TableRow key={upload.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="truncate w-40 sm:w-auto">{upload.file_name}</span>
                        <span className="text-xs text-slate-500">{upload.outlet_id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {upload.upload_status === 'parsed' ? (
                        <span className="inline-flex flex-shrink-0 items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Parsed
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                          Failed
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {recentUploads.length === 0 && (
                  <TableRow><TableCell colSpan={2} className="text-center text-slate-500 h-24">No uploads yet. Sync and upload a .xls file.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

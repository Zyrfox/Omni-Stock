export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { salesReports, salesReportDetails } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
    try {
        // Fetch recent upload reports from DB
        const reports = await db.select()
            .from(salesReports)
            .orderBy(desc(salesReports.waktu_upload))
            .limit(30);

        if (reports.length === 0) {
            // Return empty array so chart shows "no data" gracefully
            return NextResponse.json([]);
        }

        // Fetch all report details and group by report_id
        const allDetails = await db.select().from(salesReportDetails);
        const detailsByReport = new Map<string, { matched: number; unmatched: number; totalQty: number }>();
        for (const d of allDetails) {
            const key = d.report_id;
            if (!detailsByReport.has(key)) {
                detailsByReport.set(key, { matched: 0, unmatched: 0, totalQty: 0 });
            }
            const entry = detailsByReport.get(key)!;
            if (d.match_status === 'matched') {
                entry.matched += d.qty_terjual;
            } else {
                entry.unmatched += d.qty_terjual;
            }
            entry.totalQty += d.qty_terjual;
        }

        const monthMap: Record<string, string> = {
            'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04',
            'Mei': '05', 'Juni': '06', 'Juli': '07', 'Agustus': '08',
            'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12'
        };

        // Aggregate stock movements per calendar date
        const dateMap = new Map<string, { masuk: number; keluar: number; penyesuaian: number; sortKey: number }>();

        for (const r of reports) {
            if (!r.file_name) continue;

            // Try to extract date from file_name: "... - DD Bulan YYYY - ..."
            const dateMatch = r.file_name.match(/(\d{2})\s+([\wé]+)\s+(\d{4})/);
            let dateKey: string;
            let sortKey: number;

            if (dateMatch) {
                const day = dateMatch[1];
                const monthName = dateMatch[2];
                const year = dateMatch[3];
                const monthNum = monthMap[monthName] || '01';
                dateKey = `${parseInt(day)} ${monthName.slice(0, 3)}`;
                sortKey = new Date(`${year}-${monthNum}-${day}`).getTime();
            } else if (r.waktu_upload) {
                const d = new Date(r.waktu_upload);
                dateKey = `${d.getDate()} ${d.toLocaleDateString('id-ID', { month: 'short' })}`;
                sortKey = d.getTime();
            } else {
                continue;
            }

            if (!dateMap.has(dateKey)) {
                dateMap.set(dateKey, { masuk: 0, keluar: 0, penyesuaian: 0, sortKey });
            }

            const entry = dateMap.get(dateKey)!;
            const details = detailsByReport.get(r.id);

            if (details) {
                entry.masuk += details.matched;
                entry.keluar += details.totalQty;
                entry.penyesuaian += details.unmatched;
            }
        }

        // Sort by actual calendar date (chronological), take last 7
        const data = Array.from(dateMap.entries())
            .map(([date, values]) => ({
                date,
                masuk: values.masuk,
                keluar: values.keluar,
                penyesuaian: values.penyesuaian,
                _sortKey: values.sortKey,
            }))
            .sort((a, b) => a._sortKey - b._sortKey)
            .map(({ _sortKey, ...rest }) => rest)
            .slice(-7);

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching stock movement:", error);
        return NextResponse.json({ error: 'Failed to fetch stock movement data' }, { status: 500 });
    }
}


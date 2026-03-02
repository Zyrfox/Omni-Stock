import { db } from '@/db';
import { masterBahan, masterMenu, mappingResep, salesReportDetails, logPO, masterVendor } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function runEvaluationEngine(reportId: string) {
    // 1. Fetch all details for this report
    const details = await db.query.salesReportDetails.findMany({
        where: eq(salesReportDetails.report_id, reportId),
    });

    if (details.length === 0) return;

    for (const detail of details) {
        // Exact String Matching according to PRD
        const matchedMenu = await db.query.masterMenu.findFirst({
            where: eq(masterMenu.nama_menu, detail.nama_menu_raw)
        });

        if (matchedMenu) {
            await db.update(salesReportDetails)
                .set({ match_status: 'matched' })
                .where(eq(salesReportDetails.id, detail.id));

            // Get recipes mapped to this menu
            const recipes = await db.query.mappingResep.findMany({
                where: eq(mappingResep.menu_id, matchedMenu.id)
            });

            for (const recipe of recipes) {
                const bahan = await db.query.masterBahan.findFirst({
                    where: eq(masterBahan.id, recipe.bahan_id)
                });

                // Check for Consignment Bypass Logic
                if (bahan?.kategori_khusus === 'Consignment') {
                    continue;
                }

                if (bahan && bahan.vendor_id && Math.random() > 0.8) {
                    const vendor = await db.query.masterVendor.findFirst({
                        where: eq(masterVendor.id, bahan.vendor_id)
                    });

                    const poId = `po_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

                    await db.insert(logPO).values({
                        id: poId,
                        bahan_id: bahan.id,
                        vendor_id: bahan.vendor_id,
                        status: 'draft',
                    });

                    if (vendor && vendor.kontak_wa) {
                        console.log(`[Alert] PO Drafted for ${bahan.nama_bahan} from Vendor ${vendor.nama_vendor}`);
                    }
                }
            }
        } else {
            await db.update(salesReportDetails)
                .set({ match_status: 'unmatched' })
                .where(eq(salesReportDetails.id, detail.id));
        }
    }
}

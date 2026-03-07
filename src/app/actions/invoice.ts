"use server";

import { db } from "@/db";
import { invoices, invoiceItems } from "@/db/schema";
import { POItem } from "@/lib/store/usePOBuilder";
import { auth } from "@/auth";

export async function saveInvoiceDrafts(groupedPOs: Record<string, POItem[]>) {
    console.log("[INVOICE_ACTION] Saving Invoices to Database...");

    // Cepu Logic: Server-Side Stamp
    const session = await auth();
    const createdBy = (session?.user as { username?: string })?.username || "System";

    try {
        const vendorNames = Object.keys(groupedPOs);

        for (const vendor of vendorNames) {
            const items = groupedPOs[vendor];
            const invoiceId = crypto.randomUUID();

            const totalItems = items.length;
            const totalBiaya = items.reduce((sum, item) => sum + (item.qty * (item.harga_satuan || 0)), 0);

            // Insert Invoice Header
            await db.insert(invoices).values({
                id: invoiceId,
                vendor_nama: vendor,
                total_items: totalItems,
                total_biaya: totalBiaya,
                status: "UNPAID",
                created_by: createdBy // PRD V5.5 Audit Trail
            });

            // Insert Invoice Items
            for (const item of items) {
                await db.insert(invoiceItems).values({
                    id: crypto.randomUUID(),
                    invoice_id: invoiceId,
                    bahan_id: item.id_bahan,
                    nama_bahan: item.nama_bahan,
                    qty: item.qty,
                    harga_satuan: item.harga_satuan || 0
                });
            }
        }

        return { success: true };
    } catch (error: unknown) {
        console.error("[INVOICE_ACTION] Error saving invoices:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" };
    }
}

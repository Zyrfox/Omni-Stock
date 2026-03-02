'use server'

import { db } from '@/db'
import { salesReports, salesReportDetails } from '@/db/schema'
import * as xlsx from 'xlsx'
import { runEvaluationEngine } from '@/lib/evaluation-engine';

export async function processUpload(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) {
        return { success: false, error: 'No file provided' };
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse the legacy .xls file
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON array, parsing as header: 1 to get raw arrays of rows
        const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

        // PRD says: skip 7 baris pertama (mulai baris ke-8)
        const dataRows = data.slice(7);

        // Generate unique ID for the report
        const reportId = `rep_${Date.now()}`;

        // Save report to database. Using 'O-001' as mock outlet
        await db.insert(salesReports).values({
            id: reportId,
            file_name: file.name,
            upload_status: 'parsed',
            outlet_id: 'O-001',
        });

        const detailsToInsert = [];
        for (const row of dataRows) {
            if (row.length < 2 || !row[0]) continue;

            // PRD says: trim spasi pada kolom Nama Menu
            const rawMenuName = String(row[0]).trim();
            const qty = parseInt(String(row[1]), 10) || 0;

            if (qty > 0) {
                detailsToInsert.push({
                    id: `det_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    report_id: reportId,
                    nama_menu_raw: rawMenuName,
                    qty_terjual: qty,
                    match_status: 'unmatched', // Next step: evaluation engine will update this
                });
            }
        }

        if (detailsToInsert.length > 0) {
            await db.insert(salesReportDetails).values(detailsToInsert);
        }

        // Run On-Demand Evaluation Engine
        await runEvaluationEngine(reportId);

        return {
            success: true,
            message: `File ${file.name} successfully parsed. ${detailsToInsert.length} items logged.`
        };

    } catch (error: Error | unknown) {
        console.error("Upload error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

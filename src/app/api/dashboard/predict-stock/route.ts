import { NextResponse } from 'next/server';
import { db } from '@/db';
import { masterBahan, inventoryLogs, uploadBatches } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const batches = await db.select().from(uploadBatches).orderBy(desc(uploadBatches.created_at));

        if (batches.length < 3) {
            return NextResponse.json({
                predictions: [],
                message: "Belum ada data historis yang memadai untuk membuat prediksi AI."
            });
        }

        const latestBatch = batches[0];
        const logs = await db.select().from(inventoryLogs).where(eq(inventoryLogs.batch_id, latestBatch.id));
        const allBahan = await db.select().from(masterBahan);

        const lowStockItems = logs.filter(log => log.current_stock <= log.min_stock).map(log => {
            const b = allBahan.find(x => x.id === log.id_bahan);
            return {
                id: log.id_bahan,
                nama: b?.nama_bahan || 'Unknown',
                stok: log.current_stock,
                min: log.min_stock,
                satuan: b?.satuan_dasar || 'Pcs'
            };
        });

        if (lowStockItems.length === 0) {
            return NextResponse.json({ predictions: [] });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            // Fallback mock if no API key
            const predictions = lowStockItems.map(item => ({
                bahan_id: item.id, nama_bahan: item.nama, current_stock: item.stok,
                satuan: item.satuan, days_left: 3, confidence: 85,
                suggested_qty: item.min * 2 - item.stok > 0 ? item.min * 2 - item.stok : 10
            }));
            return NextResponse.json({ predictions: predictions.slice(0, 5) });
        }

        const prompt = `Anda adalah sistem AI perencana restock restoran.
Data barang dengan stok menipis:
${JSON.stringify(lowStockItems)}

Tugas Anda:
1. Asumsikan rata-rata penjualan per hari adalah 15% dari batas minimum (min * 0.15) atau minimum 1.
2. Hitung days_left = stok / rata-rata penjualan per hari. Bandingkan current_stock dengan rata-rata penjualan.
3. PENTING: Jika hasil hitungan days_left > 90 hari, kembalikan status "Aman" dan JANGAN masukkan ke list Urgent.
4. Tentukan confidence (70-98%) dan suggested_qty (min * 2 - stok).
5. Output format WAJIB berupa JSON array murni tanpa markdown, contoh:
[{"bahan_id": "...", "nama_bahan": "...", "current_stock": 10, "satuan": "Pcs", "days_left": 5, "confidence": 92, "suggested_qty": 20}]`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1 }
            })
        });

        if (!response.ok) {
            throw new Error('Gemini API Error');
        }

        const data = await response.json();
        let textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

        // Clean markdown backticks if present
        textOutput = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();

        const aiPredictions = JSON.parse(textOutput);

        // Sort by most urgent
        if (Array.isArray(aiPredictions)) {
            aiPredictions.sort((a, b) => a.days_left - b.days_left);
            return NextResponse.json({ predictions: aiPredictions.slice(0, 5) });
        }

        return NextResponse.json({ predictions: [] });

    } catch (error) {
        console.error("[PREDICT_API] Error:", error);
        return NextResponse.json({ error: "Failed to generate AI predictions" }, { status: 500 });
    }
}

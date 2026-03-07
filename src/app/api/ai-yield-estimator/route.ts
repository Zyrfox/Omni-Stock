export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { bahan_nama, kemasan_beli, satuan_saji } = payload;

        if (!bahan_nama || !kemasan_beli || !satuan_saji) {
            return NextResponse.json({ error: "Lengkapi data bahan, kemasan, dan satuan saji" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("[AI Yield] Missing GEMINI_API_KEY, returning mock data");
            return NextResponse.json({
                estimated_yield_qty: 15,
                reasoning: "API Key tidak ditemukan. Ini adalah contoh mock-up hasil."
            });
        }

        const promptText = `Saya manajer F&B.
Bahan baku: ${bahan_nama}
Kemasan beli: ${kemasan_beli}
Satuan penyajian resep: ${satuan_saji}

Berikan estimasi rasional berapa ${satuan_saji} yang bisa dihasilkan dari 1 kemasan beli tersebut, secara realistis dengan memperhitungkan shrinkage/penyusutan dapur.

WAJIB mengembalikan JSON MURNI tanpa markdown formatting, tanpa penjelasan di luar JSON. Harap patuhi struktur berikut:
{
  "estimated_yield_qty": number,
  "reasoning": "string (penjelasan singkat rasio dan shrinkage)"
}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: {
                    temperature: 0.3,
                    responseMimeType: "application/json",
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const data = await response.json();
        let aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Clean markdown backticks if Gemini ignores mimeType
        aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();

        const parsed = JSON.parse(aiText);

        return NextResponse.json({
            estimated_yield_qty: parsed.estimated_yield_qty,
            reasoning: parsed.reasoning
        });

    } catch (error: unknown) {
        console.error("[AI Yield Error]:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal menghubungi AI" }, { status: 500 });
    }
}

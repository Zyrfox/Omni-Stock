export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "Gemini API key is missing" }, { status: 500 });
        }

        const { userInputs, catalog } = await req.json();

        if (!userInputs || !Array.isArray(userInputs) || userInputs.length === 0) {
            return NextResponse.json({ error: "userInputs array is required" }, { status: 400 });
        }
        if (!catalog || !Array.isArray(catalog) || catalog.length === 0) {
            return NextResponse.json({ error: "catalog array is required" }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const prompt = `Anda adalah sistem ERP F&B yang ahli dalam mendeduksi nama bahan baku masakan.
Tugas Anda adalah memetakan (matching) alias/bahasa dapur yang diketik oleh user dengan daftar Master Katalog resmi dari sistem kami.

Pencocokan harus bersifat Semantik & Kontekstual. (Contoh: Jika input user adalah 'Sayap', maka cari produk di katalog yang mengandung kata 'Sayap' atau identik dengan potongan ayam sayap).
Jika tidak ada sama sekali kemiripan atau tidak masuk akal, tetapkan matched_id sebagai null.

User Inputs yang perlu dicari pasangannya: 
${JSON.stringify(userInputs, null, 2)}

Katalog Resmi Master Bahan:
${JSON.stringify(catalog, null, 2)}

Return HANYA JSON murni berupa array of objects dengan struktur persis seperti ini:
[
  { 
    "original_input": "Sayap", 
    "matched_id": "bhn_...', 
    "matched_name": "Ayam Marinasi (D'Kriuk) Sayap", 
    "satuan": "Pcs", 
    "confidence": "high/low" 
  }
]
Perhatian: Jika tidak ada kecocokan, matched_id dan matched_name dan satuan harus bernilai null.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        let parsedJSON;
        try {
            parsedJSON = JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse Gemini JSON:", responseText);
            throw new Error("Invalid output format from AI");
        }

        return NextResponse.json(parsedJSON);

    } catch (error: any) {
        console.error("[AI-Match Endpoint Error]:", error);
        return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
    }
}

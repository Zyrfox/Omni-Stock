import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { bahan_nama, budget } = await req.json();

        if (!bahan_nama || !budget) {
            return NextResponse.json({ error: 'Missing bahan_nama or budget' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('[MARKET_PRICE] No GEMINI_API_KEY found.');
            // Fallback mock if no API key is present for safety
            return NextResponse.json({
                success: true,
                estimated_qty: Number((budget / 15000).toFixed(2)),
                note: 'Mock API response (Missing API Key)'
            });
        }

        const prompt = `Anda adalah asisten estimator harga pasar bahan baku restoran HORECA di Indonesia. Klien memiliki budget sebesar Rp ${budget} untuk membeli "${bahan_nama}". Berikan estimasi berapa kuantitas (Qty) yang bisa didapatkan berdasarkan harga wajar di pasaran saat ini. Ingat, satuan biasanya Pcs, Kg, atau Liter.

PENTING: Jawab HANYA DENGAN SATU ANGKA (bulat atau desimal), tanpa teks tambahan apapun, tanpa satuan. Contoh jawaban wajib: "15" atau "2.5"`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 10,
                }
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Gemini API Error: ${response.status} - ${errBody}`);
        }

        const data = await response.json();
        const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textOutput) {
            throw new Error('Unexpected Gemini API response format');
        }

        // Clean up response to ensure it is just a number
        const cleanNumberStr = textOutput.replace(/[^0-9.]/g, '');
        const estimatedQty = parseFloat(cleanNumberStr);

        if (isNaN(estimatedQty)) {
            // Fallback parsing failed
            return NextResponse.json({
                success: true,
                estimated_qty: Number((budget / 10000).toFixed(2)),
                note: 'AI returned non-number, using fallback.'
            });
        }

        return NextResponse.json({
            success: true,
            estimated_qty: estimatedQty
        });

    } catch (error: unknown) {
        console.error('[MARKET_PRICE] Error:', error);
        return NextResponse.json({ error: 'Failed to predict market price' }, { status: 500 });
    }
}

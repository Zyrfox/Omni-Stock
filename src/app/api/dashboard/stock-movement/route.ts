import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Mock data for the 3-Line chart: Stok Masuk, Stok Keluar, Stok Penyesuaian
        const mockData = [
            { date: '1 Mar', masuk: 120, keluar: 80, penyesuaian: 5 },
            { date: '2 Mar', masuk: 50, keluar: 90, penyesuaian: -2 },
            { date: '3 Mar', masuk: 200, keluar: 110, penyesuaian: 0 },
            { date: '4 Mar', masuk: 30, keluar: 150, penyesuaian: -10 },
            { date: '5 Mar', masuk: 90, keluar: 85, penyesuaian: 4 },
            { date: '6 Mar', masuk: 150, keluar: 100, penyesuaian: 0 },
            { date: '7 Mar', masuk: 110, keluar: 130, penyesuaian: -5 },
        ];

        return NextResponse.json(mockData);
    } catch (error) {
        console.error("Error fetching stock movement:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

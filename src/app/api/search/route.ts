import { NextResponse } from "next/server";
import { db } from "@/db";
import { masterMenu, masterBahan } from "@/db/schema";
import { like, or } from "drizzle-orm";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json([]);
    }

    try {
        const lowerQuery = query.toLowerCase();
        const results = [];

        // Mock Smart Query logic for "stok keluar hari ini"
        if (lowerQuery.includes('stok keluar') || lowerQuery.includes('hari ini')) {
            results.push({
                id: 'smart-1',
                title: 'Laporan Stok Keluar Hari Ini',
                description: 'Lihat ringkasan stok keluar dari semua outlet',
                type: 'report',
                url: '/dashboard'
            });
        }

        // Search Master Menu
        const menus = await db.select().from(masterMenu)
            .where(like(masterMenu.nama_menu, `%${query}%`))
            .limit(3);

        for (const menu of menus) {
            results.push({
                id: `menu-${menu.id}`,
                title: menu.nama_menu,
                description: `Menu Outlet ${menu.outlet_id}`,
                type: 'product',
                url: '/products'
            });
        }

        // Search Master Bahan
        const bahans = await db.select().from(masterBahan)
            .where(like(masterBahan.nama_bahan, `%${query}%`))
            .limit(3);

        for (const bahan of bahans) {
            results.push({
                id: `bahan-${bahan.id}`,
                title: bahan.nama_bahan,
                description: `Batas Minimum: ${bahan.batas_minimum} ${bahan.satuan_dasar}`,
                type: 'product',
                url: '/products'
            });
        }

        // Add a mock order/store search logic if needed
        if (lowerQuery.includes('mas ahmad')) {
            results.push({
                id: 'supplier-1',
                title: 'Vendor: Mas Ahmad',
                description: 'Supplier Sayur & Bumbu',
                type: 'store',
                url: '/suppliers'
            });
        }

        return NextResponse.json(results.slice(0, 5)); // Enforce TOP 5
    } catch (error) {
        return NextResponse.json({ error: "Failed to search" }, { status: 500 });
    }
}

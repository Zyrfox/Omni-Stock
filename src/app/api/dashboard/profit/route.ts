import { NextResponse } from 'next/server';
import { db } from '@/db';
import { salesHistory } from '@/db/schema';
import { fetchMasterData } from '@/lib/gsheets';
import { gte } from 'drizzle-orm';

export async function GET() {
    try {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const allSales = await db.select().from(salesHistory).where(gte(salesHistory.date, oneMonthAgo));
        const masterData = await fetchMasterData();

        if (!masterData) throw new Error("Master Data Not Available");

        let foodProfit = 0;
        let drinksProfit = 0;
        let addonProfit = 0;

        // Grouping logic based on master menu category
        for (const sale of allSales) {
            const menu = masterData.menu.find(m => m.id === sale.id_menu);
            const category = menu?.kategori?.toLowerCase() || "others"; // Assuming exists in GSheets

            if (category.includes('food') || category.includes('makanan')) {
                foodProfit += sale.gross_profit;
            } else if (category.includes('drink') || category.includes('minuman')) {
                drinksProfit += sale.gross_profit;
            } else {
                addonProfit += sale.gross_profit; // Fallback
            }
        }

        return NextResponse.json({
            profits: [
                { name: "Food", value: foodProfit, color: "#D4FF00" },
                { name: "Drinks", value: drinksProfit, color: "#1A1D1F" },
                { name: "Add-ons", value: addonProfit, color: "#6F767E" }
            ]
        });

    } catch (error) {
        console.error("[PROFIT_API] Error fetching Profit data:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

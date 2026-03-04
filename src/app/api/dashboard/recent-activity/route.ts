import { NextResponse } from 'next/server';
import { db } from '@/db';
import { activityLog } from '@/db/schema';
import { desc, gte } from 'drizzle-orm';

export async function GET() {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const activities = await db.query.activityLog.findMany({
            where: gte(activityLog.timestamp, todayStart),
            orderBy: [desc(activityLog.timestamp)],
            limit: 5
        });

        return NextResponse.json(activities);
    } catch (error) {
        console.error("[ACTIVITY_API] Error:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

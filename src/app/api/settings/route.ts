import { NextResponse } from 'next/server';
import { db } from '@/db';
import { appSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        const settings = await db.select().from(appSettings);
        const result: Record<string, string> = {};
        for (const s of settings) {
            result[s.key] = s.value;
        }
        return NextResponse.json(result);
    } catch (error) {
        console.error("[SETTINGS_API] Error:", error);
        return NextResponse.json({}, { status: 200 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { settings } = body as { settings: Record<string, string> };

        if (!settings || typeof settings !== 'object') {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        for (const [key, value] of Object.entries(settings)) {
            if (typeof value !== 'string') continue;
            await db.insert(appSettings).values({ key, value })
                .onConflictDoUpdate({
                    target: appSettings.key,
                    set: { value },
                });
        }

        return NextResponse.json({ success: true, message: 'Settings saved.' });
    } catch (error) {
        console.error("[SETTINGS_API] Error:", error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}

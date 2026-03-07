export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { syncMasterData } from '@/app/actions/sync';

export async function POST() {
    try {
        const result = await syncMasterData();

        if (result.success) {
            return NextResponse.json({ success: true, message: result.message });
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }
    } catch (error: unknown) {
        console.error("[SYNC_API] Error:", error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to sync' }, { status: 500 });
    }
}

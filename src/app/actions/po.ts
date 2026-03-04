'use server'

import { db } from '@/db'
import { logPO } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function approvePO(poId: string) {
    try {
        await db.update(logPO)
            .set({ status: 'approved' })
            .where(eq(logPO.id, poId));

        revalidatePath('/po-logs');
        revalidatePath('/'); // Dashboard might also need to refresh the pending count

        return { success: true, message: `PO ${poId} has been marked as approved.` };
    } catch (error: Error | unknown) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred while approving PO." };
    }
}

export async function undoPO(poId: string) {
    try {
        await db.update(logPO)
            .set({ status: 'draft' })
            .where(eq(logPO.id, poId));

        revalidatePath('/po-logs');
        revalidatePath('/'); // Dashboard might also need to refresh the pending count

        return { success: true, message: `PO ${poId} status has been reverted to draft.` };
    } catch (error: Error | unknown) {
        console.error("Undo PO error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred while undoing PO." };
    }
}

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { inventoryState } from '@/db/schema';
import { eq } from 'drizzle-orm';

// PATCH: Update stok bahan
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id_bahan, current_stock } = body;

        if (!id_bahan || current_stock === undefined) {
            return NextResponse.json({ error: 'id_bahan dan current_stock wajib diisi' }, { status: 400 });
        }

        await db.update(inventoryState)
            .set({ current_stock: parseFloat(current_stock), last_updated: new Date() })
            .where(eq(inventoryState.id_bahan, id_bahan));

        return NextResponse.json({ success: true, message: `Stok ${id_bahan} berhasil diperbarui.` });
    } catch (error) {
        console.error("[INVENTORY] Update error:", error);
        return NextResponse.json({ error: 'Gagal memperbarui stok' }, { status: 500 });
    }
}

// DELETE: Hapus item inventori
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id_bahan = searchParams.get('id_bahan');

        if (!id_bahan) {
            return NextResponse.json({ error: 'id_bahan wajib diisi' }, { status: 400 });
        }

        await db.delete(inventoryState).where(eq(inventoryState.id_bahan, id_bahan));

        return NextResponse.json({ success: true, message: `Item ${id_bahan} berhasil dihapus.` });
    } catch (error) {
        console.error("[INVENTORY] Delete error:", error);
        return NextResponse.json({ error: 'Gagal menghapus item' }, { status: 500 });
    }
}

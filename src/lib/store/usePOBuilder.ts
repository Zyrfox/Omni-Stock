import { create } from 'zustand';

export interface POItem {
    id_bahan: string;
    nama_bahan: string;
    qty: number;
    harga_satuan: number;
    vendor_id: string;
    vendor_nama: string;
    info_pembayaran: string | null;
    kontak_wa?: string;
}

interface POStore {
    approvedPOs: POItem[];
    addPO: (item: POItem) => void;
    removePO: (id_bahan: string) => void;
    clearPOs: () => void;
}

export const usePOBuilder = create<POStore>((set) => ({
    approvedPOs: [],
    addPO: (item) => set((state) => {
        // If already exists, update the qty instead of duplicating
        const existingIndex = state.approvedPOs.findIndex(p => p.id_bahan === item.id_bahan);
        if (existingIndex >= 0) {
            const updatedPOs = [...state.approvedPOs];
            updatedPOs[existingIndex] = item;
            return { approvedPOs: updatedPOs };
        }
        return { approvedPOs: [...state.approvedPOs, item] };
    }),
    removePO: (id_bahan) => set((state) => ({
        approvedPOs: state.approvedPOs.filter(p => p.id_bahan !== id_bahan)
    })),
    clearPOs: () => set({ approvedPOs: [] })
}));

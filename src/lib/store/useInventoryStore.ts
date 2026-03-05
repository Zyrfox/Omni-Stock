import { create } from 'zustand';
import { MatchedInventoryItem } from '@/lib/engine';

interface InventoryStore {
    inventoryData: MatchedInventoryItem[];
    outlet: string;
    lastUpload: Date | null;
    setInventoryData: (items: MatchedInventoryItem[], outlet: string) => void;
    clearInventory: () => void;
}

export const useInventoryStore = create<InventoryStore>((set) => ({
    inventoryData: [],
    outlet: '',
    lastUpload: null,
    setInventoryData: (items, outlet) => set({ inventoryData: items, outlet, lastUpload: new Date() }),
    clearInventory: () => set({ inventoryData: [], outlet: '', lastUpload: null }),
}));

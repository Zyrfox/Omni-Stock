// Shared outlet configuration for the entire app
// Add new outlets here and they will be available everywhere

export interface Outlet {
    id: string;       // prefix used in product IDs, e.g. 'btmk'
    name: string;     // full display name
}

export const OUTLETS: Outlet[] = [
    { id: 'btmk', name: 'Back To Mie Kitchen' },
    { id: 'btmf', name: 'Back To Mie Forest' },
    { id: 'tsf', name: 'Taman Sari Forest' },
    { id: 'hc', name: 'Healthopia Clinic & Pharmacy' },
];

// Lookup: prefix → full name
export const OUTLET_MAP: Record<string, string> = Object.fromEntries(
    OUTLETS.map(o => [o.id, o.name])
);

// Resolve outlet name from a product/bahan ID
export function resolveOutletName(itemId: string): string {
    const prefix = itemId.split('_')[0];
    return OUTLET_MAP[prefix] || prefix.toUpperCase();
}

// --- Category Prefix Mapping ---
export const CATEGORY_MAP: Record<string, string> = {
    'Food': 'fd',
    'Beverage': 'bv',
    'Beverage Hot': 'bh',
    'Beverage Ice': 'bi',
    'Add On': 'ao',
    'Dessert': 'ds',
};

export const DEFAULT_CATEGORIES = Object.keys(CATEGORY_MAP);

// Resolve a category string to a short prefix
// For known categories, use the map. For custom ones, take first 2-3 consonants.
export function resolveCategoryPrefix(category: string): string {
    const upper = category.trim();
    if (CATEGORY_MAP[upper]) return CATEGORY_MAP[upper];
    // Fallback: extract lowercase consonants
    const consonants = upper.toLowerCase().replace(/[aeiou\s]/g, '');
    return consonants.slice(0, 3) || upper.toLowerCase().slice(0, 2);
}

// Generate a new product ID given the outlet prefix, category prefix, and existing IDs
export function generateProductId(outletPrefix: string, catPrefix: string, existingIds: string[]): string {
    // Filter IDs that belong to this outlet + category combination
    const combo = `${outletPrefix}_${catPrefix}_`;
    const matchingIds = existingIds.filter(id => id.startsWith(combo));

    // Find the highest numeric suffix
    let maxNum = 0;
    for (const id of matchingIds) {
        const parts = id.split('_');
        const numPart = parts[parts.length - 1];
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxNum) {
            maxNum = num;
        }
    }

    // Increment and pad to 3 digits
    const nextNum = String(maxNum + 1).padStart(3, '0');

    return `${outletPrefix}_${catPrefix}_${nextNum}`;
}

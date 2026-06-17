export type DraftModule =
    | 'lead'
    | 'project'
    | 'booking'
    | 'work_order'
    | 'invoice'
    | 'purchase_request'
    | 'purchase_order'
    | 'tenant'
    | 'user';

export type DraftRecord<TData = unknown> = {
    draftId: string;
    module: DraftModule;
    data: TData;
    createdAt: string;
    updatedAt: string;
};

const STORAGE_KEY = 'arris-drafts-v1';

function nowIso() {
    return new Date().toISOString();
}

function readAll(): DraftRecord[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed as DraftRecord[];
    } catch {
        return [];
    }
}

function writeAll(next: DraftRecord[]) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function generateDraftId() {
    if (typeof window !== 'undefined' && typeof window.crypto?.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }
    // Fallback: reasonably unique for local drafts
    return `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export const draftService = {
    saveDraft<TData>(module: DraftModule, data: TData, draftId?: string): DraftRecord<TData> {
        const all = readAll();
        const existingId = draftId?.trim() || '';
        const now = nowIso();

        if (existingId) {
            const idx = all.findIndex((d) => d.draftId === existingId && d.module === module);
            if (idx >= 0) {
                const prev = all[idx] as DraftRecord<TData>;
                const next: DraftRecord<TData> = { ...prev, data, updatedAt: now };
                const copy = [...all];
                copy[idx] = next as DraftRecord;
                writeAll(copy);
                return next;
            }
        }

        const created: DraftRecord<TData> = {
            draftId: generateDraftId(),
            module,
            data,
            createdAt: now,
            updatedAt: now,
        };
        writeAll([created as DraftRecord, ...all]);
        return created;
    },

    getDrafts<TData>(module: DraftModule): DraftRecord<TData>[] {
        return readAll()
            .filter((d) => d.module === module)
            .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)) as DraftRecord<TData>[];
    },

    getDraftById<TData>(id: string): DraftRecord<TData> | null {
        const draftId = id?.trim();
        if (!draftId) return null;
        const all = readAll();
        const found = all.find((d) => d.draftId === draftId);
        return (found as DraftRecord<TData> | undefined) ?? null;
    },

    deleteDraft(id: string): boolean {
        const draftId = id?.trim();
        if (!draftId) return false;
        const all = readAll();
        const next = all.filter((d) => d.draftId !== draftId);
        if (next.length === all.length) return false;
        writeAll(next);
        return true;
    },
};


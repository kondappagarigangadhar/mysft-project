'use client';

import { useEffect, useSyncExternalStore } from 'react';
import type { ResidentProfile, ResidentSession } from '../utils/types';
import { clearStorageKey, readStorageJson, writeStorageJson } from '../utils/storage';
import { nowIso } from '../utils/date';
import {
    DEMO_RESIDENT_PORTAL_ID,
    DEMO_RESIDENT_PROFILE,
    DEMO_RESIDENT_SLUG,
} from '@/lib/residentDemoProfile';

const SESSION_KEY = 'mysft.resident.session.v1';
const PROFILES_KEY = 'mysft.resident.profiles.v2';

type ProfilesDb = Record<string, { profile: ResidentProfile; passwordHashLike: string }>;

type StoreState = {
    session: ResidentSession;
    profiles: ProfilesDb;
};

function buildDefaultProfiles(): ProfilesDb {
    const d = DEMO_RESIDENT_PROFILE;
    return {
        [DEMO_RESIDENT_PORTAL_ID]: {
            profile: {
                id: DEMO_RESIDENT_PORTAL_ID,
                fullName: d.fullName,
                phone: d.phoneDisplay,
                email: d.email,
                unitNumber: d.unitNumber,
                residentType: d.residentType,
                moveInDate: d.moveInDate,
                approvalStatus: 'Approved',
                avatarUrl: '',
                lastLoginAt: nowIso(),
                adminResidentSlug: DEMO_RESIDENT_SLUG,
            },
            passwordHashLike: 'demo',
        },
        resident_james_nguyen: {
            profile: {
                id: 'resident_james_nguyen',
                fullName: 'James Nguyen',
                phone: '9876500011',
                email: 'james.nguyen@example.com',
                unitNumber: '902',
                residentType: 'Tenant',
                moveInDate: '2025-11-18',
                approvalStatus: 'Approved',
                avatarUrl: '',
                lastLoginAt: nowIso(),
                adminResidentSlug: 'james-nguyen',
            },
            passwordHashLike: 'demo',
        },
        resident_priya_mehta: {
            profile: {
                id: 'resident_priya_mehta',
                fullName: 'Priya Mehta',
                phone: '9820012345',
                email: 'priya.mehta@example.com',
                unitNumber: '1204',
                residentType: 'Owner',
                moveInDate: '2024-02-01',
                approvalStatus: 'Approved',
                avatarUrl: '',
                lastLoginAt: nowIso(),
                adminResidentSlug: 'priya-mehta',
            },
            passwordHashLike: 'demo',
        },
    } satisfies ProfilesDb;
}

/** Keep demo portal account aligned with admin Resident Management seed. */
function mergeStoredProfiles(stored: ProfilesDb | null): ProfilesDb {
    const defaults = buildDefaultProfiles();
    if (!stored) return defaults;

    const merged: ProfilesDb = { ...defaults };

    for (const [id, row] of Object.entries(stored)) {
        if (id === DEMO_RESIDENT_PORTAL_ID) {
            merged[id] = {
                profile: {
                    ...defaults[DEMO_RESIDENT_PORTAL_ID]!.profile,
                    lastLoginAt: row.profile.lastLoginAt ?? defaults[DEMO_RESIDENT_PORTAL_ID]!.profile.lastLoginAt,
                },
                passwordHashLike: row.passwordHashLike || 'demo',
            };
            continue;
        }
        if (defaults[id]) {
            merged[id] = {
                profile: { ...defaults[id]!.profile, lastLoginAt: row.profile.lastLoginAt ?? defaults[id]!.profile.lastLoginAt },
                passwordHashLike: row.passwordHashLike || defaults[id]!.passwordHashLike,
            };
            continue;
        }
        merged[id] = row;
    }

    return merged;
}

function initialState(): StoreState {
    const storedSession = readStorageJson<ResidentSession>(SESSION_KEY);
    const storedProfiles = readStorageJson<ProfilesDb>(PROFILES_KEY);

    const session: ResidentSession = storedSession ?? { isAuthenticated: false, remember: true };
    const profiles = mergeStoredProfiles(storedProfiles);

    return { session, profiles };
}

let state: StoreState = initialState();
const listeners = new Set<() => void>();

function emit() {
    for (const l of listeners) l();
}

function persist() {
    writeStorageJson(SESSION_KEY, state.session, state.session.remember);
    // Keep profiles always in localStorage for a more app-like experience.
    writeStorageJson(PROFILES_KEY, state.profiles, true);
}

export function residentAuthApi() {
    return {
        getSession() {
            return state.session;
        },
        getCurrentResident() {
            if (!state.session.isAuthenticated || !state.session.residentId) return null;
            return state.profiles[state.session.residentId]?.profile ?? null;
        },
        getProfiles() {
            return state.profiles;
        },
        logout() {
            state = { ...state, session: { isAuthenticated: false, remember: state.session.remember } };
            persist();
            emit();
        },
        loginWithResidentCredentials(opts: { identifier: string; password: string; remember: boolean }) {
            const identifier = opts.identifier.trim().toLowerCase();
            const match = Object.values(state.profiles).find((p) => {
                return (
                    p.profile.email.toLowerCase() === identifier ||
                    p.profile.phone.replace(/\s/g, '').toLowerCase() === identifier.replace(/\s/g, '').toLowerCase()
                );
            });

            if (!match) {
                return { ok: false as const, error: 'Account not found. Please register or try a different email/phone.' };
            }

            if (match.profile.approvalStatus !== 'Approved') {
                if (match.profile.approvalStatus === 'Rejected') {
                    return {
                        ok: false as const,
                        error: `Registration rejected: ${match.profile.rejectionReason ?? 'Please contact support.'}`,
                    };
                }
                return { ok: false as const, error: 'Your account is pending approval. Please try again later.' };
            }

            if (opts.password.trim() !== match.passwordHashLike) {
                return { ok: false as const, error: 'Incorrect password.' };
            }

            const nextSession: ResidentSession = {
                isAuthenticated: true,
                residentId: match.profile.id,
                remember: opts.remember,
            };

            state = {
                ...state,
                session: nextSession,
                profiles: {
                    ...state.profiles,
                    [match.profile.id]: {
                        ...state.profiles[match.profile.id],
                        profile: { ...match.profile, lastLoginAt: nowIso() },
                    },
                },
            };

            persist();
            emit();
            return { ok: true as const };
        },
        loginWithMySftSso(opts: { remember: boolean }) {
            const demo = state.profiles[DEMO_RESIDENT_PORTAL_ID]?.profile;
            if (!demo) return { ok: false as const, error: 'SSO is not configured yet.' };
            state = {
                ...state,
                session: { isAuthenticated: true, residentId: demo.id, remember: opts.remember },
                profiles: {
                    ...state.profiles,
                    [demo.id]: { ...state.profiles[demo.id], profile: { ...demo, lastLoginAt: nowIso() } },
                },
            };
            persist();
            emit();
            return { ok: true as const };
        },
        registerResident(payload: Omit<ResidentProfile, 'id' | 'approvalStatus' | 'lastLoginAt'> & { password: string }) {
            const id = `resident_${Math.random().toString(16).slice(2)}_${Date.now()}`;
            const profile: ResidentProfile = {
                ...payload,
                id,
                approvalStatus: 'Pending Approval',
            };

            state = {
                ...state,
                profiles: {
                    ...state.profiles,
                    [id]: { profile, passwordHashLike: payload.password.trim() || 'demo' },
                },
            };
            // Registration should not automatically log in (approval required).
            persist();
            emit();
            return { ok: true as const, residentId: id };
        },
        verifyOtp(_opts: { residentId: string; otp: string }) {
            // Mock OTP: accept any 6 digits.
            return { ok: true as const };
        },
        // Mock admin decision hooks (for demo): not exposed in UI yet.
        __approve(residentId: string) {
            const row = state.profiles[residentId];
            if (!row) return;
            state = {
                ...state,
                profiles: {
                    ...state.profiles,
                    [residentId]: {
                        ...row,
                        profile: { ...row.profile, approvalStatus: 'Approved', rejectionReason: undefined },
                    },
                },
            };
            persist();
            emit();
        },
        __reject(residentId: string, reason: string) {
            const row = state.profiles[residentId];
            if (!row) return;
            state = {
                ...state,
                profiles: {
                    ...state.profiles,
                    [residentId]: {
                        ...row,
                        profile: { ...row.profile, approvalStatus: 'Rejected', rejectionReason: reason || 'Not specified' },
                    },
                },
            };
            persist();
            emit();
        },
        clearAll() {
            clearStorageKey(SESSION_KEY);
            clearStorageKey(PROFILES_KEY);
            state = initialState();
            emit();
        },
    };
}

export function useResidentSession() {
    const subscribe = (cb: () => void) => {
        listeners.add(cb);
        return () => listeners.delete(cb);
    };
    const getSnapshot = () => state;
    const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    // Keep state in sync across tabs.
    useEffect(() => {
        const onStorage = () => {
            state = initialState();
            emit();
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    return {
        session: snap.session,
        currentResident: snap.session.residentId ? snap.profiles[snap.session.residentId]?.profile ?? null : null,
    };
}


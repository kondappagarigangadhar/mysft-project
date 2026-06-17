'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { RoleOriginBadge } from '@/components/access-matrix/RoleOriginBadge';
import type { AssignedMatrixUser, MatrixRole } from '@/lib/accessMatrix/types';
import type { User } from '@/data/mockData';
import { getUsers } from '@/data/mockData';
import { userCreateHref, userListHref } from '@/lib/userRoutes';
import { cn } from '@/lib/utils';
import { CTA_INPUT_FOCUS, CTA_SHADOW_SOFT } from '@/lib/theme/ctaThemeClasses';
import type { IconType } from 'react-icons';
import { LuExternalLink, LuPlus, LuSearch, LuUserMinus, LuUsers, LuUserPlus } from 'react-icons/lu';

function platformUserToAssigned(u: User): AssignedMatrixUser {
    const status: AssignedMatrixUser['status'] =
        u.status === 'Active' ? 'Active' : u.status === 'Pending' ? 'Invited' : 'Suspended';
    return {
        id: `platform-u-${u.id}`,
        name: u.name,
        email: u.email,
        department: u.department || '—',
        status,
        lastActive: u.lastLogin?.trim() || u.joined || '—',
    };
}

function initials(name: string): string {
    const p = name.trim().split(/\s+/).filter(Boolean);
    if (p.length === 0) return '?';
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function statusDot(status: AssignedMatrixUser['status'] | User['status']) {
    if (status === 'Active') return 'bg-emerald-500';
    if (status === 'Pending' || status === 'Invited') return 'bg-amber-500';
    return 'bg-slate-400';
}

type AssignRoleUsersModalProps = {
    open: boolean;
    role: MatrixRole | null;
    assignedUsers: AssignedMatrixUser[];
    onClose: () => void;
    onAssignUsers: (users: User[]) => void;
    onRemoveUser: (userId: string) => void;
};

function PanelShell({
    title,
    count,
    icon: Icon,
    children,
    className,
}: {
    title: string;
    count: number;
    icon: IconType;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                'flex min-h-[280px] flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-slate-50/50',
                className,
            )}
        >
            <div className="flex shrink-0 items-center gap-2 border-b border-slate-200/80 bg-white/80 px-3 py-2.5">
                <Icon className="h-4 w-4 text-slate-500" aria-hidden />
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">{title}</h4>
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {count}
                </span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">{children}</div>
        </section>
    );
}

function UserAvatar({ name }: { name: string }) {
    return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--cta-button-bg)_14%,white)] text-[10px] font-bold text-[var(--cta-button-bg)]">
            {initials(name)}
        </span>
    );
}

export function AssignRoleUsersModal({
    open,
    role,
    assignedUsers,
    onClose,
    onAssignUsers,
    onRemoveUser,
}: AssignRoleUsersModalProps) {
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());

    const platformUsers = useMemo(() => getUsers(), [open]);

    const assignedEmails = useMemo(
        () => new Set(assignedUsers.map((u) => u.email.toLowerCase())),
        [assignedUsers],
    );

    const availableUsers = useMemo(() => {
        const q = search.trim().toLowerCase();
        return platformUsers.filter((u) => {
            if (assignedEmails.has(u.email.toLowerCase())) return false;
            if (!q) return true;
            const hay = `${u.name} ${u.email} ${u.department} ${u.roleName ?? u.role}`.toLowerCase();
            return hay.includes(q);
        });
    }, [platformUsers, assignedEmails, search]);

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAllVisible = () => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            for (const u of availableUsers) next.add(u.id);
            return next;
        });
    };

    const clearSelection = () => setSelectedIds(new Set());

    const handleAssign = () => {
        const picked = platformUsers.filter((u) => selectedIds.has(u.id));
        if (picked.length === 0) return;
        onAssignUsers(picked);
        setSelectedIds(new Set());
        setSearch('');
    };

    const handleClose = () => {
        setSelectedIds(new Set());
        setSearch('');
        onClose();
    };

    const createHref = role
        ? `${userCreateHref()}?from=access-matrix&matrixRole=${encodeURIComponent(role.id)}`
        : userCreateHref();

    return (
        <Modal
            isOpen={open}
            onClose={handleClose}
            title="Assign users"
            maxWidthClassName="max-w-5xl"
            placement="top"
            bodyClassName="p-0 sm:p-0"
            footer={
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500">
                        {selectedIds.size > 0 ? (
                            <span>
                                <span className="font-semibold text-slate-800">{selectedIds.size}</span> selected to
                                add
                            </span>
                        ) : (
                            'Select users from the directory, then assign.'
                        )}
                    </p>
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button type="button" variant="companyOutline" size="cta" onClick={handleClose}>
                            Close
                        </Button>
                        <Button
                            type="button"
                            variant="company"
                            size="cta"
                            className={CTA_SHADOW_SOFT}
                            disabled={selectedIds.size === 0}
                            onClick={handleAssign}
                        >
                            <LuUserPlus className="h-4 w-4" />
                            Assign{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                        </Button>
                    </div>
                </div>
            }
        >
            {/* Role + quick actions */}
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="min-w-0">
                    {role ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{role.name}</span>
                            <RoleOriginBadge role={role} size="sm" />
                        </div>
                    ) : null}
                    <p className="mt-0.5 text-xs text-slate-500">Manage who has this role in the access matrix.</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                        href={userListHref()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:border-[var(--cta-button-bg)] hover:text-[var(--cta-button-bg)]"
                    >
                        <LuUsers className="h-3.5 w-3.5" />
                        All users
                        <LuExternalLink className="h-3 w-3 opacity-50" />
                    </Link>
                    <Link
                        href={createHref}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--cta-button-bg)] px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:opacity-90"
                    >
                        <LuPlus className="h-3.5 w-3.5" />
                        Create user
                    </Link>
                </div>
            </div>

            {/* Two-column body */}
            <div className="grid grid-cols-1 gap-3 p-4 sm:p-5 lg:grid-cols-2">
                <PanelShell title="Assigned to role" count={assignedUsers.length} icon={LuUsers}>
                    {assignedUsers.length === 0 ? (
                        <p className="px-2 py-8 text-center text-xs leading-relaxed text-slate-500">
                            No users on this role yet. Pick people from the directory on the right.
                        </p>
                    ) : (
                        <ul className="space-y-1">
                            {assignedUsers.map((u) => (
                                <li
                                    key={u.id}
                                    className="group flex items-center gap-2 rounded-lg border border-transparent bg-white px-2 py-2 shadow-sm transition hover:border-slate-200"
                                >
                                    <UserAvatar name={u.name} />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-slate-900">{u.name}</p>
                                        <p className="truncate text-[11px] text-slate-500">{u.email}</p>
                                    </div>
                                    <span
                                        className={cn('h-2 w-2 shrink-0 rounded-full', statusDot(u.status))}
                                        title={u.status}
                                    />
                                    <button
                                        type="button"
                                        className="shrink-0 rounded-md p-1.5 text-slate-400 opacity-70 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                        aria-label={`Remove ${u.name}`}
                                        onClick={() => onRemoveUser(u.id)}
                                    >
                                        <LuUserMinus className="h-4 w-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </PanelShell>

                <PanelShell title="Add from directory" count={availableUsers.length} icon={LuUserPlus}>
                    <div className="mb-2 px-1">
                        <div className="relative">
                            <LuSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search directory…"
                                className={cn(
                                    'h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-2 text-sm text-slate-900 placeholder:text-slate-400',
                                    CTA_INPUT_FOCUS,
                                )}
                            />
                        </div>
                        {availableUsers.length > 0 ? (
                            <div className="mt-2 flex gap-2 px-0.5">
                                <button
                                    type="button"
                                    className="text-[11px] font-semibold text-[var(--cta-button-bg)] hover:underline"
                                    onClick={selectAllVisible}
                                >
                                    Select all shown
                                </button>
                                {selectedIds.size > 0 ? (
                                    <button
                                        type="button"
                                        className="text-[11px] font-semibold text-slate-500 hover:underline"
                                        onClick={clearSelection}
                                    >
                                        Clear
                                    </button>
                                ) : null}
                            </div>
                        ) : null}
                    </div>

                    {availableUsers.length === 0 ? (
                        <p className="px-2 py-6 text-center text-xs leading-relaxed text-slate-500">
                            {platformUsers.length === 0 ? (
                                <>
                                    No users in the platform.{' '}
                                    <Link href={createHref} className="font-semibold text-[var(--cta-button-bg)] underline">
                                        Create one
                                    </Link>
                                </>
                            ) : search.trim() ? (
                                'No matches. Try another search.'
                            ) : (
                                'Everyone in the directory is already on this role.'
                            )}
                        </p>
                    ) : (
                        <ul className="space-y-1">
                            {availableUsers.map((u) => {
                                const checked = selectedIds.has(u.id);
                                return (
                                    <li key={u.id}>
                                        <label
                                            className={cn(
                                                'flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-2 transition',
                                                checked
                                                    ? 'border-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)]'
                                                    : 'border-transparent bg-white shadow-sm hover:border-slate-200',
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-[var(--cta-button-bg)]"
                                                checked={checked}
                                                onChange={() => toggleSelect(u.id)}
                                            />
                                            <UserAvatar name={u.name} />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-slate-900">{u.name}</p>
                                                <p className="truncate text-[11px] text-slate-500">
                                                    {u.department}
                                                    {u.roleName || u.role ? ` · ${u.roleName ?? u.role}` : ''}
                                                </p>
                                            </div>
                                            <span
                                                className={cn('h-2 w-2 shrink-0 rounded-full', statusDot(u.status))}
                                                title={u.status}
                                            />
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </PanelShell>
            </div>
        </Modal>
    );
}

export { platformUserToAssigned };

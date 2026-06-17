import {
    departments as seedDepartments,
    getBusinessUnits,
    getUsers,
    type Department,
} from '@/data/mockData';

let departments: Department[] = [...seedDepartments];

function resolveBusinessUnit(businessUnitId: number) {
    return getBusinessUnits().find((bu) => bu.id === businessUnitId);
}

function resolveDepartmentHead(departmentHeadId?: number) {
    if (!departmentHeadId) return { departmentHeadId: undefined, departmentHeadName: undefined };
    const user = getUsers().find((u) => u.id === departmentHeadId);
    return { departmentHeadId, departmentHeadName: user?.name };
}

export function getDepartmentsList(): Department[] {
    return [...departments];
}

export function getDepartmentById(id: number): Department | undefined {
    return departments.find((d) => d.id === id);
}

export function createDepartment(
    input: Omit<Department, 'id' | 'businessUnitName' | 'departmentHeadName' | 'usersCount' | 'createdDate' | 'updatedAt'> & {
        usersCount?: number;
        createdDate?: string;
        updatedAt?: string;
    },
): Department {
    const bu = resolveBusinessUnit(input.businessUnitId);
    const head = resolveDepartmentHead(input.departmentHeadId);
    const next: Department = {
        ...input,
        id: Math.max(0, ...departments.map((d) => d.id)) + 1,
        businessUnitName: bu?.name ?? '—',
        departmentHeadName: head.departmentHeadName,
        departmentHeadId: head.departmentHeadId,
        usersCount: input.usersCount ?? 0,
        createdDate: input.createdDate ?? new Date().toISOString().slice(0, 10),
        updatedAt: input.updatedAt ?? new Date().toISOString(),
        status: input.status ?? 'Active',
    };
    departments = [next, ...departments];
    return next;
}

export function updateDepartment(
    id: number,
    patch: Partial<
        Pick<
            Department,
            | 'name'
            | 'code'
            | 'businessUnitId'
            | 'description'
            | 'departmentHeadId'
            | 'status'
            | 'usersCount'
            | 'associatedProjectsCount'
        >
    >,
): Department | undefined {
    const idx = departments.findIndex((d) => d.id === id);
    if (idx < 0) return undefined;
    const prev = departments[idx]!;
    const bu =
        patch.businessUnitId !== undefined ? resolveBusinessUnit(patch.businessUnitId) : undefined;
    let headPatch: Pick<Department, 'departmentHeadId' | 'departmentHeadName'> | undefined;
    if ('departmentHeadId' in patch) {
        const resolved = resolveDepartmentHead(patch.departmentHeadId);
        headPatch = {
            departmentHeadId: resolved.departmentHeadId,
            departmentHeadName: resolved.departmentHeadName,
        };
    }
    const next: Department = {
        ...prev,
        ...patch,
        businessUnitName: bu?.name ?? prev.businessUnitName,
        ...(headPatch ?? {}),
        updatedAt: new Date().toISOString(),
    };
    departments = departments.map((d, i) => (i === idx ? next : d));
    return next;
}

export function deleteDepartmentById(id: number): boolean {
    const before = departments.length;
    departments = departments.filter((d) => d.id !== id);
    return departments.length < before;
}

export function duplicateDepartment(id: number): Department | undefined {
    const src = departments.find((d) => d.id === id);
    if (!src) return undefined;
    const copyName = `${src.name} (Copy)`;
    const codeBase = src.code ? `${src.code}-COPY` : copyName.slice(0, 6).toUpperCase().replace(/\s/g, '');
    return createDepartment({
        name: copyName,
        code: codeBase.slice(0, 12),
        businessUnitId: src.businessUnitId,
        departmentHeadId: src.departmentHeadId,
        status: src.status,
        description: src.description ? `${src.description} (Copy)` : undefined,
        usersCount: 0,
    });
}

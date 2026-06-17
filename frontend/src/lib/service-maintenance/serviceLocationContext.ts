/** Parse project / tower from a resident location unit string. */
export function parseServiceLocationContext(locationUnit: string): { project: string; tower: string; unitLabel: string } {
    const trimmed = locationUnit.trim();
    const sep = ' — ';
    const idx = trimmed.indexOf(sep);
    if (idx < 0) {
        return { project: trimmed, tower: trimmed, unitLabel: trimmed };
    }
    const project = trimmed.slice(0, idx).trim();
    const unitLabel = trimmed.slice(idx + sep.length).trim();
    return { project, tower: project, unitLabel };
}

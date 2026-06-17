# Module 4 — Documents & Compliance

## 1. Module purpose

| Audience | Explanation |
|----------|-------------|
| **Business** | Central **document lifecycle** (register, version, classify), **eSign (Aadhaar)** flows, **audit** visibility, **soft-deleted** records, and **AI** assistance for policy-heavy real estate operations. |
| **Technical** | Routes under **`/company-admin/documents-compliance`** (+ `documents-compliance-ai`). Primary store: `complianceDocumentsMockStore` (+ RBAC helpers `complianceRbac.ts`). Role hook: `useComplianceRole`. |
| **User flow** | Document hub → list / filter → open **view** or **edit** → optional version modal → eSign requests tracked separately. |

---

## 2. Main features

- **Document management hub** `/company-admin/documents-compliance` (table / filters — see page).
- **Unified view** `/company-admin/documents-compliance/view/[id]` with `id === 'new'` for **create**.
- **Edit** routes: `[id]/edit`, `esign/[id]/edit`, etc.
- **eSign** listing + **new** request.
- **Audit & activity** dedicated page.
- **Deleted records** recovery / audit.
- **Documents AI** `/company-admin/documents-compliance-ai`.
- **RBAC:** `canView`, `canEdit` gate buttons and routes.

---

## 3. Page structure

| Route | Purpose |
|-------|---------|
| `/company-admin/documents-compliance` | Main hub |
| `/company-admin/documents-compliance/view/[id]` | View / create (`new`) — `DocumentDetailView`, `DocumentVersionModal` |
| `/company-admin/documents-compliance/view/new` | Flyout “Add document” target |
| `/company-admin/documents-compliance/[id]` | Redirect → `/view/[id]` |
| `/company-admin/documents-compliance/[id]/edit` | Redirect to edit flow |
| `/company-admin/documents-compliance/new` | Legacy / helper redirect |
| `/company-admin/documents-compliance/esign` | eSign list |
| `/company-admin/documents-compliance/esign/new` | New eSign |
| `/company-admin/documents-compliance/esign/[id]/edit` | Edit eSign |
| `/company-admin/documents-compliance/audit` | Audit |
| `/company-admin/documents-compliance/deleted` | Deleted bucket |
| `/company-admin/documents-compliance-ai` | AI |

**Flyouts (`DOCUMENTS_HUB_FLYOUT`, `ESIGN_HUB_FLYOUT`):** quick add, history → `?module=documents`.

---

## 4. Table page analysis

- **Hub list:** columns for title, type, status, owner, dates (inspect `documents-compliance/page.tsx`).
- **Filters / search:** pattern aligned with other admin tables.
- **Row actions:** view, download (logs `logDownload`), version history.
- **Empty states:** standard card + CTA to upload / create.

---

## 5. View page analysis

- **`DocumentDetailView`:** tabs driven by `initialTab` query (see `view/[id]/page.tsx` for `tab` parsing).
- **Version modal:** `DocumentVersionModal` for file uploads / version stack.
- **Toolbar:** back to list, edit href when permitted, versions button.

---

## 6. Create / edit flow

- **Create:** `view/new` route with `createMode` boolean; `getDocumentById` skipped when new.
- **Redirects:** `[id]/page.tsx` uses `router.replace` to canonical view URL — avoids duplicate content routes.
- **Validation:** field-level in forms under `components/documents-compliance/` + schemas in `lib/*` if present.

---

## 7. History system

- **Module:** `documents` in global history.
- **Audit page:** operational audit separate from `history-logs` mock stream (business-facing).
- **Store-level:** view/download actions logged via `logView`, `logDownload`.

---

## 8. Relationships

| From | To |
|------|-----|
| Documents | Bookings (booking tab shows linked docs) |
| Documents | Leads / customers | Metadata references depending on record |
| eSign | Document versions | eSign request tied to compliance record |
| Compliance AI | Policies / doc text | AI route under `documents-compliance-ai` |

---

## 9. UI / UX patterns

- **Breadcrumb** stacks with `BASE = '/company-admin/documents-compliance'`.
- **RBAC-driven** disabled buttons vs hidden sections.
- **Modal** for versions to keep main view clean.

---

## 10. Architecture notes

| Topic | Location |
|-------|----------|
| Store | `src/lib/complianceDocumentsMockStore.ts` |
| RBAC | `src/lib/complianceRbac.ts` |
| UI | `src/components/documents-compliance/*` |
| Types | `src/lib/historyLogs/types.ts` (`documents` module) |

**Beginner tip:** Read `view/[id]/page.tsx` first — it composes the main shell and props for `DocumentDetailView`.

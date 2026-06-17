# Module 8 — Work Orders

## 1. Module purpose

| Audience | Explanation |
|----------|-------------|
| **Business** | Tracks **operational work** assigned to vendors/suppliers: scope, status, cost, schedules, and **field execution** details — connects procurement to delivery. |
| **Technical** | Routes under **`/work-orders`** (root app, not under `/company-admin` prefix) with **`CompanyAdminDashboardLayout`** on pages for consistent chrome. Store: `workOrderStore` (`getWorkOrderBySlugIncludingArchived`, `buildEmptyWorkOrderDraft`). Primary UI: `WorkOrderRecordTabs`, `WorkOrderDetailShell`. |
| **User flow** | List → open WO **view** → tabbed detail / inline edits → **drafts** list for in-progress WOs → **create** at `/work-orders/view/new`. |

---

## 2. Main features

- **List page** `/work-orders` — table with filters, bulk actions (if enabled), link to view.
- **View / create** `/work-orders/view/[slug]` with `slug === 'new'` for **create** (canonical).
- **Legacy create redirect** `/work-orders/create` → **`/work-orders/view/new`** (`create/page.tsx`).
- **Drafts** `/work-orders/drafts`.
- **Flyout:** create, drafts, **history** → `?module=work_orders`.

---

## 3. Page structure

| Route | Purpose |
|-------|---------|
| `/work-orders` | List hub |
| `/work-orders/view/new` | Create (empty draft from `buildEmptyWorkOrderDraft`) |
| `/work-orders/view/[slug]` | Detail / edit tabs |
| `/work-orders/drafts` | Draft picker |
| `/work-orders/create` | Redirect only |

**Components:** `WorkOrderDetailShell` (breadcrumb, layout), `WorkOrderRecordTabs` (tabs, inline overview editor, etc.).

---

## 4. Table page analysis

- **Columns:** work order id, title, vendor, status, dates — confirm in `work-orders/page.tsx` / list content component.
- **Filters:** status / vendor / search (per implementation).
- **Row actions:** open `view/[slug]`.
- **Pagination:** standard `DataTable` / `Pagination` if wired.

---

## 5. View page analysis

- **Breadcrumbs:** set in `view/[slug]/page.tsx` — includes “Procurement Management” label for business context.
- **Tabs:** `WorkOrderRecordTabs` — includes overview, line items / costs, attachments, history (inspect file for authoritative tab ids).
- **Local persistence:** `activeWorkOrderSlug` saved to `localStorage` on slug change (for refresh / cross-page continuity).
- **Not found:** `WorkOrderNotFound` component when slug missing.

---

## 6. Create / edit flow

| Mode | Detection |
|------|-------------|
| Create | `slug === 'new'` |
| View | existing slug, no edit query |
| Edit | sections inside tabs toggle edit state or use shared inline editor (`WorkOrderInlineOverviewEditor`) |

**Store bump:** `listVersion` / `onBump` pattern refreshes after mutations.

---

## 7. History system

- **Module:** `work_orders` in `HISTORY_MODULES`.
- **Sidebar:** “Work orders history” → filtered global log.
- **Record tabs:** likely dedicated history subview inside `WorkOrderRecordTabs`.

---

## 8. Relationships

| From | To |
|------|-----|
| Work orders | Vendors | Vendor assignment fields |
| Work orders | Suppliers / materials | Line items may reference catalog SKUs |
| Work orders | Projects | Optional project/site linkage in WO record |

---

## 9. UI / UX patterns

- **Detail shell** wraps tabs with consistent padding and breadcrumb.
- **Inline editors** for quick field updates on overview tab.
- **Drafts** first-class route (same philosophy as booking drafts).

---

## 10. Architecture notes

| Topic | Location |
|-------|----------|
| Pages | `src/app/work-orders/**` |
| Components | `src/components/work-orders/**` |
| Store | `src/lib/workOrderStore.ts` (name may vary slightly — grep `workOrder`) |
| Sidebar hub | `workOrdersHubRowIsActive` matches any `/work-orders` prefix + history module |

**Beginner tip:** Read `view/[slug]/page.tsx` (~40 lines) then jump to **`WorkOrderRecordTabs.tsx`** — it is large but is the single source of truth for WO UX.

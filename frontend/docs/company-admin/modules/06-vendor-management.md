# Module 6 — Vendor Management

## 1. Module purpose

| Audience | Explanation |
|----------|-------------|
| **Business** | Manages **vendor master data**, **assignments** to jobs/projects, **compliance** documentation, **contracts**, **performance** KPIs, and **alerts** — feeds **work orders** and procurement risk controls. |
| **Technical** | Routes under **`/company-admin/vendors`** (+ subpaths). UI in `src/components/vendors/`. Sidebar hub row + **`VENDOR_MANAGEMENT_FLYOUT`**. |
| **User flow** | Vendor list → open vendor profile / detail → manage compliance & contracts → monitor alerts and performance. |

---

## 2. Main features

Flyout shortcuts (`CompanyAdminSidebar.tsx`):

- Create vendor
- Vendor list
- Vendor compliance
- Vendor contracts
- Vendor performance
- Vendor alerts center
- **History** → `/company-admin/history-logs?module=vendors`

**List / profile patterns:** `VendorListPage`, `VendorProfilePage`, specialized centers (`VendorContractsCenterPage`, etc. — discover via `components/vendors/`).

---

## 3. Page structure

| Route | Purpose |
|-------|---------|
| `/company-admin/vendors` | Hub / list entry |
| `/company-admin/vendors/list` | Explicit list (also treated as active when on `/vendors` root per `flyoutEntryIsActive`) |
| `/company-admin/vendors/create` | Create vendor (layout uses **full-bleed** main in `company-admin/layout.tsx`) |
| `/company-admin/vendors/[id]` | Vendor profile / detail (compliance, contracts, project-scoped work orders, performance) |
| `/company-admin/vendors/compliance` | Compliance |
| `/company-admin/vendors/contracts` | Contracts center |
| `/company-admin/vendors/performance` | Performance analytics |
| `/company-admin/vendors/alerts` | Alerts |

---

## 4. Table page analysis

- **Vendor list:** sortable columns, filters, row link to `[id]`.
- **Alerts / performance:** KPI tiles + tables.

---

## 5. View page analysis

- **Vendor profile** uses **tabs** (`VendorMainTabBar`, `supplierDetailTabIds`-style patterns — confirm in `VendorProfilePage.tsx`).
- **Inline editing** on profile sections with save/cancel per section or global save.

---

## 6. Create / edit flow

- **Create:** `/company-admin/vendors/create` — special-cased layout removes max-width for long forms.
- **Edit:** typically embedded in profile tabs or dedicated edit routes inside `[id]` subtree (grep `edit` under `vendors/`).

---

## 7. History system

- **Module:** `vendors` in `HISTORY_MODULES`.
- **Sidebar:** “Vendors history” flyout link.
- **Profile:** optional `history` tab or embedded timeline in vendor components.

---

## 8. Relationships

| From | To |
|------|-----|
| Vendors | Work orders | WO references vendor |
| Vendors | Contracts / compliance | Documents stored or linked |
| Vendors | Company admin dashboard | Quick stats / deep links from `companies` pages (where applicable) |

---

## 9. UI / UX patterns

- **Flyout navigation** mirrors Booking hub pattern.
- **Full-bleed create** for dense vendor onboarding forms.
- **DataTable** with persisted column state (`storageKey` pattern in vendor tables).

---

## 10. Architecture notes

| Topic | Location |
|-------|----------|
| Components | `src/components/vendors/**` |
| Stores | `src/lib/vendors*` or `vendor*` (glob `lib` for vendor) |
| Sidebar active logic | `navItemIsActive` excludes `/create`, compliance/contracts centers, etc., for hub row vs child highlighting |

**Beginner tip:** Start at `app/company-admin/vendors/page.tsx` and follow imports into `VendorListPage` / `VendorProfilePage`.

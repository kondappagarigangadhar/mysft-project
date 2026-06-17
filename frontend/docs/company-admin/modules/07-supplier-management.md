# Module 7 — Supplier Management

## 1. Module purpose

| Audience | Explanation |
|----------|-------------|
| **Business** | Maintains **supplier** relationships distinct from **vendors** (often materials / logistics vs services), including **list/create**, **profile**, and ties to **procurement** catalog and **compliance** artifacts. |
| **Technical** | Routes **`/company-admin/suppliers`** (+ `list`, `create` redirect, `[id]`). Components under `src/components/suppliers/`. Store stack in `src/lib/suppliers/`. Sidebar flyout: **`SUPPLIER_MANAGEMENT_FLYOUT`**. |
| **User flow** | Supplier hub → list → open supplier **profile** with tabs → jump to procurement satellite pages (catalog, pricing, capacity, compliance). |

---

## 2. Main features

Flyout entries:

- Create supplier (`/company-admin/suppliers/create` → redirects to **`/company-admin/suppliers/new`** with query preserved)
- Supplier list
- Material Catalog (procurement)
- Supplier Pricing (procurement)
- Supply Capacity (procurement)
- Supplier Compliance (procurement)
- **History** → `?module=suppliers`

**Profile UI:** `SupplierProfilePage` with tab bar and data tables per tab.

---

## 3. Page structure

| Route | Purpose |
|-------|---------|
| `/company-admin/suppliers` | Hub |
| `/company-admin/suppliers/list` | List (active state merged with hub root in sidebar helper) |
| `/company-admin/suppliers/create` | Redirect to `.../new` |
| `/company-admin/suppliers/new` | Actual create surface (layout full-bleed like vendors create) |
| `/company-admin/suppliers/[id]` | Supplier profile |

---

## 4. Table page analysis

- **Supplier list:** similar to vendors — `DataTable`, filters, link to profile.
- **Tab tables inside profile:** materials, pricing, bundles — see `SupplierProfilePage.tsx`.

---

## 5. View page analysis

- **Tabs:** `SupplierMainTabBar` + tab ids in `supplierDetailTabIds.ts`.
- **Create mode:** `createMode` flag inside profile when `id` is `new` (pattern mirrors other modules).

---

## 6. Create / edit flow

```mermaid
flowchart LR
  C[/suppliers/create] --> N[/suppliers/new]
  N --> P[SupplierProfilePage createMode]
  P --> S[Save persists to supplierRelationsStore]
```

- **Redirects:** `create/page.tsx` uses `router.replace` to canonical `new` route.

---

## 7. History system

- **Module:** `suppliers` in `HISTORY_MODULES`.
- **Sidebar:** “Suppliers history” link from flyout.

---

## 8. Relationships

| From | To |
|------|-----|
| Suppliers | Material catalog | Flyout deep link |
| Suppliers | Work orders | Operational PO / WO context (when wired in mock) |
| Suppliers | Company pages | `companies` UI may reference supplier rows |

---

## 9. UI / UX patterns

- **Tabbed profile** with **DataTable** per tab and persisted preferences (`storageKey` suffix `-supplier-*-tab-v1`).
- **Modal editing** for nested rows (materials) in `SupplierProfilePage`.

---

## 10. Architecture notes

| Topic | Location |
|-------|----------|
| UI | `src/components/suppliers/**` |
| Store / mock | `src/lib/suppliers/*` |
| Types | `src/lib/suppliers/types.ts` |

**Beginner tip:** Compare **vendor** vs **supplier** create layouts — both opt into **full-bleed** `CompanyAdminLayout` branch for long forms.

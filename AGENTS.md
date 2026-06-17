# mySFT AI Real Estate Unified SaaS Platform — AI Agent Guide

## Project Overview

mySFT is an enterprise SaaS platform for AI-powered real estate management. It's a **monorepo** with:
- **Frontend**: Next.js 16 + React 19 (TypeScript, Tailwind CSS) with a multi-tenant, role-based UI
- **Backend**: Python (minimal docs; API-first design)
- **Development**: Run both with `npm run dev` (uses concurrently)

**Key Use Cases**: Commercial real estate CRM, lead management, compliance tracking, project inventory, demand intelligence.

---

## Development Workflow

### Quick Start
```bash
# From root
npm run dev                 # Frontend + backend concurrently
npm run dev:frontend       # Frontend only: cd frontend && npm run dev
npm run dev:backend        # Backend only: cd backend && python -m main
npm run build              # Build frontend for production
npm run lint               # ESLint check (frontend)
npm install:all            # Install all dependencies
```

**Port**: Frontend runs on http://localhost:3000 (Next.js default).

### Frontend Structure
```
frontend/
├── src/
│   ├── app/               # Next.js App Router pages (role-based layout hierarchy)
│   │   ├── /              # Public pages (login, landing)
│   │   ├── /client/       # Client role section
│   │   ├── /company-admin/ # Company admin role section
│   │   ├── api/           # API routes (minimal; mostly frontend)
│   │   └── [feature]/     # Feature sections (leads, projects, invoices, etc.)
│   ├── components/        # Reusable React components
│   │   ├── ui/            # Base UI library (Button, Input, Modal, etc.)
│   │   ├── forms/         # Feature-specific forms
│   │   └── [feature]/     # Feature-specific components
│   ├── lib/               # Utilities and state stores
│   │   ├── *Store.ts      # In-memory state (companyStore, leadStore, etc.)
│   │   ├── aiApi.ts       # Axios wrapper with caching (sessionStorage)
│   │   └── validations/   # Form validation schemas
│   ├── hooks/             # Custom React hooks
│   └── data/              # Mock data and static data
├── docs/                  # Architecture & design docs
└── public/                # Static assets
```

---

## Architecture & Patterns

### 1. **Role-Based Multi-Tenancy**
- Separate layout trees: `/client/*`, `/company-admin/*`, root
- Each role has a distinct UI/sidebar experience
- Branding customizable (see: blue `#0092ff` for "company" variants)
- **Pattern**: Check layout.tsx files for role-specific styling/navigation

### 2. **State Management (Mock Data First)**
- **No Redux/Zustand**; uses singleton in-memory stores
- Stores located in `src/lib/*Store.ts` (e.g., `companyStore.ts`, `leadStore.ts`, `residentStore.ts`)
- Stores export functions for CRUD operations
- **Use case**: Demo/prototype workflows; actual backend queries handled separately
- **Gotcha**: Data is ephemeral; page refresh loses state (by design for now)

### 3. **Form Workflows**
- Forms save **draft state** before final submission (see: `useSidebarHoverCollapse.ts`, `documentUploadDraftStorage.ts`)
- Edit mode as **query param**: `/leads/view/:slug?edit=1` (NOT a separate route)
- Validation schemas in `src/lib/*FormValidation.ts`
- **Pattern**: Redirect on save: `/leads/edit/:slug` → `/leads/view/:slug?edit=1` (see: `next.config.ts`)

### 4. **Styling & UI System**
- **Tailwind CSS 4** + PostCSS with `tailwind-merge` for safe class merging
- CSS variables in `src/app/globals.css` for theming (dark sidebar + blue accent)
- **Color scheme**: Primary orange (`#f97316`) + Company blue (`#0092ff`)
- **Utility function**: `cn()` = `clsx()` + `tailwind-merge()` for combining class names safely
- **Theme customization**: See `/settings/theme` routes (implied from globals.css and dashboard docs)

### 5. **Client-Side Rendering**
- **Every interactive page** uses `'use client'` directive
- Minimal SSR; server mostly for file serving
- Data fetching via Axios with sessionStorage caching (TTL-based)
- **API layer**: See `src/lib/aiApi.ts` for HTTP request patterns

### 6. **Canvas & Visualization**
- **Konva.js** (v10.2.3) for graphical rendering (projects-inventory, demand-intelligence)
- React bindings via `react-konva`
- **Use for**: Drag & drop layouts, interactive diagrams, canvas-based editors

### 7. **Compliance & Audit Trail**
- History logs tracked via `src/hooks/useHistoryLogs.ts` and `src/components/history-logs/`
- Suggests regulated industry (real estate) with compliance requirements
- **Pattern**: Log CRUD actions for audit trails

### 8. **Data Export**
- CSV exports throughout (leads, projects, inventory, etc.)
- Export functions typically in feature folders: `exportLeadsCsv()`, `exportProjectsInventoryCsv()`, etc.
- **Pattern**: Heavy data-driven workflows; support for bulk operations

---

## Key Conventions

| Convention | Example | Reason |
|---|---|---|
| **Component co-location** | `leads/` folder contains `page.tsx`, `layout.tsx`, components, forms, hooks | Scalability; clear feature boundaries |
| **Variant props** | `<Button variant="primary" company>` | Multiple design systems coexist |
| **Singleton stores** | `import { companyStore } from '@/lib/companyStore'` | Shared state across pages without Redux |
| **"use client" first** | Every interactive component/page | Client-side interactivity by default |
| **Query-param state** | `?edit=1`, `?view=grid` | Preserve edit/filter state in URL |
| **Draft auto-save** | Forms save to sessionStorage on blur | Prevent data loss on navigation |
| **Mock API responses** | `{ data: T }` wrapper structure | Matches backend API contract |
| **Dash-case slugs** | `/leads/view/lead-name-here` | URL-friendly identifiers |

---

## Common Tasks & Patterns

### Adding a New Feature Page
1. Create `frontend/src/app/[feature]/` directory
2. Add `page.tsx` (with `'use client'`) and optional `layout.tsx`
3. Create components in `frontend/src/components/[feature]/` folder
4. If data needed, add `frontend/src/lib/[feature]Store.ts` for mock state
5. For forms, add validation in `frontend/src/lib/[feature]FormValidation.ts`

### Calling the Backend API
- Use `src/lib/aiApi.ts` wrapper (Axios with caching)
- Request format: `await aiApi.get('/endpoint')`
- Response unwrapping: API returns `{ data: T }` structure
- Caching: sessionStorage TTL-based; avoid refetch on same request within TTL

### Styling a Component
- Use Tailwind CSS classes (not CSS modules by default)
- For dynamic classes: use `cn()` helper (`clsx` + `tailwind-merge`)
- For theme variables: reference CSS variables defined in `globals.css`

### Adding a Hook
- Place in `frontend/src/hooks/`
- Use standard React hook naming: `useFunctionName.ts`
- Export as default function
- Document dependencies (e.g., stores, contexts)

### Handling Form Submission
1. Validate using schema from `FormValidation.ts`
2. Save draft to store
3. Redirect with edit mode: `/path?edit=1`
4. Show confirmation/loading via store mutation

---

## Environment & Configuration

- **TypeScript**: Strict mode enabled; `tsconfig.json` in frontend/
- **ESLint**: React Compiler hooks are warnings (not errors) for legacy compatibility
- **Next.js Config**: Turbopack enabled for fast builds; redirects configured in `next.config.ts`
- **Environment Variable**: `NEXT_PUBLIC_API_BASE_URL` sets backend URL (check frontend env files)
- **Fonts**: Geist font optimized via `next/font`

---

## Documentation

- [Dashboard Design](frontend/docs/dashboard-design.md) — UI/UX specifications
- [Dashboard Summary](frontend/docs/dashboard-summary.md) — Super Admin Dashboard design reference
- [Next.js Docs](https://nextjs.org/docs) — Core framework
- [Tailwind CSS Docs](https://tailwindcss.com/docs) — Styling framework
- [Recharts Docs](https://recharts.org/) — Charting library
- [Konva.js Docs](https://konva.js.org/) — Canvas rendering

---

## Gotchas & Troubleshooting

### 1. **No Persistent State After Refresh**
- Stores are in-memory; page refresh clears data
- **Solution**: Backend integration or localStorage/IndexedDB for persistence

### 2. **API Responses Wrapped in `{ data: T }`**
- Don't destructure directly; use `response.data`
- **Example**: `const result = await aiApi.get('/users'); console.log(result.data)`

### 3. **Edit Mode via Query Param, Not Route**
- Pages redirect from `/path/edit/:slug` to `/path/view/:slug?edit=1`
- **Don't create separate edit routes**; use query params

### 4. **Tailwind Class Conflicts**
- Use `cn()` (clsx + tailwind-merge) to safely combine classes
- Avoids specificity issues with Tailwind utilities

### 5. **Konva Canvas State Outside React Render**
- Konva objects have imperative API
- Keep layer/stage refs stable; sync with React state manually if needed

### 6. **Role-Based Access Control**
- Check `src/lib/complianceRbac.ts` for RBAC logic
- Routing guards likely not fully implemented; consider adding route guards for sensitive pages

---

## Performance Tips

- **Caching**: `aiApi.ts` uses sessionStorage; leverage for repeated calls
- **Code Splitting**: Next.js auto-splits by route; components lazy-loaded via `dynamic()`
- **Image Optimization**: Use `next/image` for responsive images (not tested in this codebase)
- **Turbopack**: Builds are fast; watch mode rebuilds incrementally

---

## When Stuck

1. **Route not found?** Check `app/` hierarchy and layout files
2. **Store not updating?** Ensure store export is correct singleton; check for async race conditions
3. **Styles not applying?** Use browser DevTools to check Tailwind generated CSS; verify `cn()` usage
4. **API failing?** Check `NEXT_PUBLIC_API_BASE_URL` env var; confirm backend is running
5. **Build errors?** Ensure TypeScript types are correct; run `npm run lint` to catch ESLint issues

---

## Related Skills & Customizations to Consider

- **Backend setup skill**: Document Python backend entry point, API endpoints, dependencies
- **RBAC policy enforcement skill**: Ensure routes check role-based permissions (likely incomplete)
- **Form validation schema skill**: Automate validation schema generation from API types

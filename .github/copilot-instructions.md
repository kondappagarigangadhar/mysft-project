# .github/copilot-instructions.md

## ARRIS Frontend Development Instructions

This file provides additional context for AI agents working on the frontend of the ARRIS AI Real Estate SaaS Platform.

### Quick Reference

- **Framework**: Next.js 16 + React 19 + TypeScript 5
- **Styling**: Tailwind CSS 4
- **State**: In-memory stores (no Redux)
- **Env**: `NEXT_PUBLIC_API_BASE_URL` for backend URL
- **Dev Server**: `cd frontend && npm run dev` (port 3000)

### File Organization Rules

**When adding new features:**
```
frontend/src/
├── app/[role]/[feature]/          ← Route + layout
├── components/[feature]/           ← Feature components
├── lib/[feature]Store.ts           ← State management
├── lib/[feature]FormValidation.ts  ← Validation schemas
└── hooks/use[Feature]Hook.ts       ← Custom hooks
```

**Routes by role:**
- `/` - Public (login, landing)
- `/client/*` - Client-facing features
- `/company-admin/*` - Admin features
- Other - Shared or role-agnostic

### Critical Patterns

1. **"use client" on all interactive pages** — SSR is minimal
2. **Query params for state** — `/view/:id?edit=1` not separate routes
3. **Stores are singletons** — Export one instance per feature
4. **Draft auto-save** — Forms save to sessionStorage before submit
5. **API via `aiApi.ts`** — Axios wrapper with sessionStorage cache
6. **Tailwind + cn()** — Always use `cn()` for dynamic classes

### Common Imports

```typescript
// Utilities
import { cn } from '@/lib/utils';
import { aiApi } from '@/lib/aiApi';

// Stores
import { companyStore } from '@/lib/companyStore';

// Hooks
import { useHistoryLogs } from '@/hooks/useHistoryLogs';

// Components
import Button from '@/components/ui/Button';
```

### Validation Example

```typescript
// frontend/src/lib/leadFormValidation.ts
export const leadFormSchema = {
  name: { required: true, minLength: 2 },
  email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  phone: { required: false, pattern: /^\d{10}$/ }
};
```

### API Call Pattern

```typescript
try {
  const response = await aiApi.get('/leads');
  const leads = response.data; // API wraps in { data: T }
} catch (error) {
  console.error('Failed to fetch leads:', error);
}
```

### Styling Best Practices

- **Use Tailwind classes** — Avoid CSS modules unless necessary
- **Dynamic classes** — Use `cn()` helper for combining classes
- **Component variants** — Use props like `variant="primary"` or `company` flag
- **Theme colors** — Reference CSS vars from `globals.css` (dark mode support)

### Form Submission Flow

1. User fills form
2. On blur/change → **auto-save draft** to store
3. On submit → validate using schema
4. On success → redirect with `?edit=1` query param
5. Show confirmation toast/modal

### Testing & Validation

- **ESLint**: `npm run lint` (warnings allowed for legacy code)
- **TypeScript**: Strict mode; fix type errors before committing
- **No unit tests** in current setup; focus on integration at component level

### Environment Setup

Create `frontend/.env.local` if needed:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### When Adding API Integration

- Check if `aiApi.ts` caching helps (sessionStorage-based)
- Response format: `{ data: T }` — handle this wrapper
- Add validation schema in `lib/`
- Add store mutations if multi-page state needed

### Performance Considerations

- Next.js auto-splits code by route — no manual chunking needed
- Konva canvas (projects-inventory) is CPU-intensive — watch for perf
- Recharts charts render on client; large datasets may impact performance

### Debugging Tips

1. **Page not showing?** Check `app/` folder hierarchy and `page.tsx` exists
2. **Store not updating?** Verify store export is default; check for async races
3. **API 401 Unauthorized?** Backend auth token not passed; check `aiApi.ts` headers
4. **Tailwind styles missing?** Check if component has `cn()` call; verify class names
5. **Build fails?** Run `npm run lint` to catch TypeScript/ESLint issues first

# Project: financial-bpo-system

## Architecture
- Single Page Application built with React (loaded via CDN) and Supabase.
- Database access is managed via a global `window.supabaseClient` configured in `supabase.jsx`.
- Components are structured into modular `.jsx` files at the root level.
- Multi-tenant model: Users are linked to companies via the `usuarios_empresas` table or through an `owner_id` (or `user_id`) on records.
- UI/UX layout uses styled-components or standard inline/styled CSS.

## Code Layout
- `index.html`: Entrypoint loading React, Tailwind/CSS, and system scripts.
- `app.jsx`: Core application entrypoint and main application UI.
- `supabase.jsx`: Initializer of the Supabase client.
- `settings.jsx`: Administrative dashboard, user creation, and configuration.
- `workspace.jsx`: Main client workspace dashboard.
- `reports.jsx`: Financial BPO reporting screens.
- `tweaks-panel.jsx`: Direct testing / system tweaking controls.
- `hooks.jsx`: State hooks for centralizing queries.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M1 | Exploration | Codebase discovery and security architecture assessment | None | DONE |
| M2 | Security (RLS & Form Validation) | Implement rigid database RLS rules and integrate the `Validacao` validation object on all creation/edition forms | M1 | DONE |
| M3 | UI/UX Lançamentos | Enhance the "Lançamentos" view to make new entry creation highly prominent and intuitive on the page | M1 | DONE |
| M4 | Calendars & UI Style | Refresh calendar dropdown styling, hover/focus states, and selections | M1 | DONE |
| M5 | QA & Liveness | Audit buttons, handlers, and click callbacks to ensure no dead features exist | M2, M3, M4 | DONE |

## Interface Contracts
- **Global Supabase Client**: `window.supabaseClient` (auth, queries, database operations).
- **Validation Library**: `Validacao` object (strict rules for validation on insertion/update).

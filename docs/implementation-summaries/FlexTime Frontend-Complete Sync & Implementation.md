FlexTime Frontend: Complete Sync & Implementation Plan
Generated: May 29, 2025Purpose: End-to-end frontend roadmap to mirror all backend capabilities, fill UI gaps, preserve existing styling, and support both dark & light themes

🎨 1. Design & Theming Requirements
Maintain existing style while adding a fully-toggleable light theme.
1.1 Core Design Preservation
	•	Fonts & Typography: Unchanged
	•	Logos & Branding:
	◦	Dark-navbar version (flextime-white.jpg)
	◦	Light-navbar version (flextime-black.jpg)
	•	Grid & Layout: 4-column grid, glassmorphic backdrops, existing animations
1.2 Theme Variables
Declare paired CSS variables for dark/light:
/* Dark theme (existing) */
--ft-primary:   /* existing dark value */;
--ft-secondary: /* existing dark value */;
--ft-background:/* existing dark value */;
--ft-surface:   /* existing dark value */;
--ft-surface-glass: /* existing dark glass */;

/* Light theme (new) */
--ft-light-primary:   /* light equivalent */;
--ft-light-secondary: /* light equivalent */;
--ft-light-background:/* light equivalent */;
--ft-light-surface:   /* light equivalent */;
--ft-light-surface-glass: /* light glass effect */;
1.3 Theme Toggle
	•	UI: Toggle switch in TopAppBar (sun/moon icon)
	•	Behavior:
	◦	State stored in Zustand + synced to localStorage
	◦	Add CSS class theme-light or theme-dark on <html>
	◦	Default to OS preference (prefers-color-scheme)

📊 2. Backend Capabilities (Completed)
	1	Scaling & Performance
	2	Constraint System v2.0
	3	Event Streaming & WebSockets
	4	Microservices & API v2
(As detailed previously.)

🔄 3. Required Frontend Features
3.1 Real-Time Event Integration
	•	Connect to /api/v2/events/stream
	•	Handle all *.updated, *.created, *.cancelled, etc.
3.2 Performance & UX
	•	React Query caching/dedupe
	•	Skeleton loaders for 400–800 ms
	•	Optimistic updates + retry UI for rate limits
3.3 Constraint System UI
	•	Violation badges, sport-grouped panels, ML confidence bars
3.4 API v2 Endpoints
	•	Migrate calls to /schedules/optimized, /constraints/evaluate, etc.
3.5 Multi-User Collaboration
	•	Presence avatars, live cursors, conflict modal, toast alerts

🏗️ 4. Tech Stack & Architecture
	•	Framework: React + Next.js
	•	Language: TypeScript
	•	Styling: Tailwind CSS + Headless UI + MUI v6 tokens
	•	State: React Query + Zustand
	•	Realtime: socket.io-client / EventSource
	•	Testing: Jest, RTL, Cypress, axe-core
	•	Docs: Storybook + MSW + OpenAPI hook gen
Folder Layout (unchanged from prior)

📋 5. Page & Component Breakdown
(Same as before, plus below)
Global Header
	•	ThemeToggle:const ThemeToggle = () => {
	•	  const [theme, setTheme] = useThemeStore();
	•	  return (
	•	    <Switch
	•	      checked={theme === 'light'}
	•	      onChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
	•	      aria-label="Toggle light/dark mode"
	•	    />
	•	  );
	•	};
	•	
	•	Placement: TopAppBar next to notifications

🔍 6. Missing “Nice-to-Have” & Resilience
(All previous items remain, now with:)
	•	Theme Persistence Tests:
	◦	Unit tests for theme toggle, ensure correct CSS variables applied
	◦	E2E test to verify light/dark switching

🚦 7. Phase-by-Phase Roadmap
Phase
Scope
Duration
1
Setup, theming (dark + light), layouts, Auth, Dashboard + real-time events
Week 1
2
Users & Settings pages, theme toggle persistence, client caching, progressive loading
Weeks 2–3
3
Requests list/detail, AuditLogPanel, toasts, export, light-mode style refinements
Weeks 4–5
4
Scheduler builder (drag/drop, WS presence, conflict UI)
Weeks 6–8
5
Reports, PWA/offline, i18n, diagnostics, E2E tests (including theme tests)
Week 9
6
ML Insights panel, analytics dashboards, final polish, accessibility & theme compliance
Week 10

✅ 8. Testing & QA
	•	Unit: Jest + RTL (theme-store, toggle, CSS var application)
	•	E2E: Cypress flows, include light/dark toggle scenarios
	•	Visual: Chromatic snapshots in both themes
	•	A11y: axe-core, WCAG-2.2 in both themes
	•	Perf: Lighthouse CI in both themes

📞 9. Support Resources
	•	API & Events docs (no change)
	•	New: Theme Variables Guide in /docs/frontend/theming.md

With light-mode fully integrated, admins can choose their preferred appearance without sacrificing the polished FlexTime design.

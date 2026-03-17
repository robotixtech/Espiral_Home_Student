# Espiral Home Student

## Stack
Svelte 5 + Vite + TypeScript. Font: Rubik. Deployed to GitHub Pages.

## Key Commands
- Dev: `npx vite --host` (serves at `/Espiral_Home_Student/`)
- Build: `npx vite build`
- Deploy: `npx vite build && npx gh-pages -d dist`
- Public assets use `import.meta.env.BASE_URL` prefix

## Architecture
- `src/lib/program-config.ts` — **Single source of truth** for all texts, icons, hrefs, status, progress, activities, slides. Edit here first.
- `src/lib/theme.svelte.ts` — Theme colors (dark mode active). Uses `getTheme()` + `$derived` in components.
- `src/lib/navigation.svelte.ts` — Reactive navigation state (home → unit-detail → activity-slide).
- `src/lib/spiral-math.ts` — Archimedean elliptical spiral positioning.
- `src/lib/emulator.svelte.ts` — Home emulator (unit progress cycling).
- `src/lib/emulator-config.ts` — Shared emulator timing config.

### View 1: Home (Spiral Galaxy)
- `src/components/SpiralNavigator.svelte` — Main canvas. Dynamic viewBox via ResizeObserver.
- `src/components/UnitNode.svelte` — Unit circles with hover/click effects.
- `src/components/SunNode.svelte` — Central "Open Scentia" trophy node.
- `src/components/DistantGalaxy.svelte` — Miniature galaxies (C350, C550, C650).
- `src/components/EmulatorToggle.svelte` — EMU on/off toggle.

### View 2: Unit Detail (Circular Orbital)
- `src/components/UnitDetailView.svelte` — Circular activity layout with built-in activity emulator.
- `src/components/UnitCenterNode.svelte` — Central unit info circle (non-clickable). Turns green when all activities completed.
- `src/components/ActivityNode.svelte` — Activity circles with progress, check badges, status pills.
- "Continuar" node (purple, `finalProject` theme) unlocks when first activity completes.

### View 3: Activity Slide
- `src/components/ActivitySlideView.svelte` — Slide-based content viewer.
- Supports: text pages (dark overlay + card), video embeds (Vimeo), fullwidth images (blockly).
- Navigation: ">>" to advance, "Finalizar" on last slide returns to unit detail.

### Shared
- `src/components/UnitIcon.svelte` — SVG icons: flag, gear, power, car, tunnel, search, signal, alert, trophy, rocket, snowflake, binoculars.

## Programs
- **C450** — Current program (main galaxy, foreground)
- **C550** — Next program (distant, upper-left)
- **C650** — Future program (distant, upper-right, smallest)
- **C350** — Completed program (distant, lower-left)

## Why navigation uses callback props (not a global store)

The component is embedded as an iframe in Moodle. Each "view" (Home, UnitDetail, ActivitySlide)
must be an **independent, encapsulated component** — not a transformation of a shared global state.

**Before (removed):** `navigation.svelte.ts` was a global reactive store imported directly by
`SpiralNavigator`, `UnitDetailView`, `ActivityNode`, and `ActivitySlideView`. This tightly coupled
every component to the store and prevented true encapsulation.

**After (current):** Navigation state (`currentView`, `selectedUnit`, `selectedActivity`) lives as
local `$state` in `App.svelte`. Components communicate upward via **callback props**:
- `SpiralNavigator` → `onUnitSelected(unit)`
- `UnitDetailView`  → `onBack()`, `onActivitySelected(activity)`
- `ActivityNode`    → `onActivitySelected(activity)`
- `ActivitySlideView` → `onBack()`

`navigation.svelte.ts` was deleted. This is the idiomatic Svelte 5 pattern.
Do NOT reintroduce a global navigation store.

## Navigation Flow
1. **Home** → click non-locked unit with activities → **Unit Detail**
2. **Home** → click Onboarding → opens `robotix.com` (no activities, uses href)
3. **Unit Detail** → click activity with slides → **Activity Slide**
4. **Unit Detail** → "Volver" → **Home**
5. **Activity Slide** → "Finalizar" / "Volver" → **Unit Detail**

## Emulators
- **Home EMU**: cycles unit progress (locked → in-progress → completed). EMU OFF = all units completed.
- **Unit Detail EMU**: cycles activity progress within unit. EMU OFF = all activities completed.
- Both auto-start on mount. Config in `emulator-config.ts` (150ms tick, 5% step).

## Important Rules
- **Misión Control (Onboarding) is the FIRST unit**, not a final project. No activities — opens href.
- **Never commit or push automatically.** Wait for explicit user instruction.
- **When reverting**, use targeted edits, not `git checkout -- file` (risks losing unrelated changes).
- All links open in `_blank` (new tab).
- Moodle REST API returns `snake_case` — map to camelCase.
- SVG animations: avoid `r:` in keyframes (Safari incompatible). Use `transform: scale()`.
- SVG `transform-origin`: use `0 0` not `center` (Safari compat).
- SVG line filters: use `filterUnits="userSpaceOnUse"` for lines (bbox is degenerate for horizontal/vertical lines).
- "Continuar" activity: purple (`finalProject` theme), optional, unlocks when first activity completes. No progress %.
- Unit center turns green only when ALL 4 mandatory activities are completed (not before).

## Svelte MCP Server
- Configured via `.mcp.json` (project scope) — connects to `https://mcp.svelte.dev/mcp`.
- **Always use `svelte-autofixer`** to validate `.svelte` files before delivering code.
- Use `list-sections` + `get-documentation` when Svelte 5 patterns need clarification.

## Repo & URLs
- Repo: https://github.com/robotixtech/Espiral_Home_Student
- Live: https://robotixtech.github.io/Espiral_Home_Student/
- `vite.config.ts` has `base: '/Espiral_Home_Student/'`

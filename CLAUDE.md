# Espiral Home Student

## Stack
Svelte 5 + Vite + TypeScript. Font: Rubik. Deployed to GitHub Pages.

## Key Commands
- Dev: `npx vite --host` (serves at `/Espiral_Home_Student/`)
- Build: `npx vite build`
- Deploy: `npx vite build && npx gh-pages -d dist`
- Public assets use `import.meta.env.BASE_URL` prefix

## Architecture
- `src/lib/program-config.ts` — **Single source of truth** for all texts, icons, hrefs, status, progress. Edit here first.
- `src/lib/theme.svelte.ts` — Theme colors (dark mode active). Uses `getTheme()` + `$derived` in components.
- `src/lib/spiral-math.ts` — Archimedean elliptical spiral positioning.
- `src/components/SpiralNavigator.svelte` — Main canvas. Dynamic viewBox via ResizeObserver.
- `src/components/UnitNode.svelte` — Unit circles with hover/click effects.
- `src/components/SunNode.svelte` — Central "Open Scentia" trophy node.
- `src/components/DistantGalaxy.svelte` — Miniature galaxies (C350, C550, C650).
- `src/components/UnitIcon.svelte` — SVG icons switchable by `icon` key.

## Programs
- **C450** — Current program (main galaxy, foreground)
- **C550** — Next program (distant, upper-left)
- **C650** — Future program (distant, upper-right, smallest)
- **C350** — Completed program (distant, lower-left)

## Important Rules
- **Misión Control (Onboarding) is the FIRST unit**, not a final project.
- **Never commit or push automatically.** Wait for explicit user instruction.
- **When reverting**, use targeted edits, not `git checkout -- file` (risks losing unrelated changes).
- All links open in `_blank` (new tab).
- Moodle REST API returns `snake_case` — map to camelCase.
- SVG animations: avoid `r:` in keyframes (Safari incompatible). Use `transform: scale()`.
- SVG `transform-origin`: use `0 0` not `center` (Safari compat).

## Svelte MCP Server
- Configured via `.mcp.json` (project scope) — connects to `https://mcp.svelte.dev/mcp`.
- **Always use `svelte-autofixer`** to validate `.svelte` files before delivering code.
- Use `list-sections` + `get-documentation` when Svelte 5 patterns need clarification.

## Repo & URLs
- Repo: https://github.com/robotixtech/Espiral_Home_Student
- Live: https://robotixtech.github.io/Espiral_Home_Student/
- `vite.config.ts` has `base: '/Espiral_Home_Student/'`

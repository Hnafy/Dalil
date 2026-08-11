# Dark Mode — CSS Variables with Slate Ramp Inversion

**Date:** 2026-08-08
**Status:** Approved
**Owner:** opencode session

## Problem

The client app is light-only. With ~350+ hardcoded Tailwind slate/white classes
spread across ~40 JSX files, a naive `dark:` class sweep would be invasive and
error-prone. We want a professional dark mode that inverts the UI without
touching every call site.

## Approach: CSS variables (chosen by user)

Remap the entire `slate` color palette in `tailwind.config.js` to CSS custom
properties, then invert only the variable values under `.dark`. Every existing
`text-slate-*`, `bg-slate-*`, `border-slate-*`, `ring-slate-*` utility
automatically adapts — no per-file edits for the standard palette.

Tailwind 3.4+ supports slash alpha on CSS variables via the
`rgb(var(--slate-N) / <alpha-value>)` syntax.

## Requirements

- Default: follow system preference (`prefers-color-scheme: dark`).
- Manual override (toggle) persists in localStorage and wins over the system.
- Toggle available in the public Navbar and the dashboard Sidebar.
- Brand (teal) and accent (amber) colors stay unchanged; text-on-brand stays white.
- Neutral slate-gray dark surfaces (the design reads as "slate inversion").
- No flash of the wrong theme on load (inline anti-FOUC script in `index.html`).
- Accessible: focus rings, contrast, `color-scheme` for form controls/scrollbars.

## Design

### Palette inversion (slate)

| Slate | Light | Dark | Used for |
|---|---|---|---|
| 50  | 248 250 252 | 2 6 23   | page background |
| 100 | 241 245 249 | 15 23 42 | card/row backgrounds, subtle fills |
| 200 | 226 232 240 | 30 41 59 | borders |
| 300 | 203 213 225 | 51 65 85 | strong borders, ring |
| 400 | 148 163 184 | 71 85 105 | placeholder text, muted icons |
| 500 | 100 116 139 | 100 116 139 | muted text (unchanged midpoint) |
| 600 | 71 85 105  | 148 163 184 | secondary text |
| 700 | 51 65 85   | 203 213 225 | labels, primary-ish text |
| 800 | 30 41 59   | 226 232 240 | body text |
| 900 | 15 23 42   | 241 245 249 | headings |
| 950 | 2 6 23     | 248 250 252 | strongest text |

Note: `slate-500` is intentionally the same in both modes so it stays a safe
muted/neutral middle tone.

### `surface` token

A dedicated semantic token for card/input surfaces (white in light, dark
slate-900 in dark), because `bg-white` cannot be expressed through the slate
variables:

```css
:root { --surface: 255 255 255; }
.dark { --surface: 15 23 42; }
```

```js
surface: "rgb(var(--surface) / <alpha-value>)",
```

All literal `bg-white` *surface* usages (`.card`, `.input`, `.btn-secondary`,
headers, dropdowns, modals, drawers, bottom nav, empty states) are replaced
with `bg-surface` (or `bg-surface/90`, `bg-surface/95`, `bg-surface/60` for
translucent bars). `bg-white` remains only where it must stay white in both
modes: elements sitting on images or dark hero/gradient backgrounds.

### Mirror-class rule for always-dark surfaces

Elements that must stay dark in BOTH modes (footer, gallery placeholder,
overlays) use `dark:` mirror classes, since the base slate shade inverts.
The mirror pair is `slate-N` ↔ `slate-(1000-N)`, e.g.:

- `bg-slate-950 dark:bg-slate-50` → constant `#020617`
- `bg-slate-900 dark:bg-slate-100` → constant `#0f172a`
- `bg-slate-900/60 dark:bg-slate-100/60` → constant overlay
- `border-slate-800 dark:border-slate-200`, `text-slate-300 dark:text-slate-700`,
  etc.

### Tailwind config

```js
// tailwind.config.js
export default {
  darkMode: "class",
  theme: { extend: {
    colors: {
      slate: {
        50:  "rgb(var(--slate-50)  / <alpha-value>)",
        100: "rgb(var(--slate-100) / <alpha-value>)",
        ... through 950
      },
      // brand + accent unchanged
    },
  }},
};
```

### `index.css`

- `:root { --slate-50: 248 250 252; ... }` — light values (current defaults).
- `.dark { --slate-50: 2 6 23; ... }` — inverted values (table above).
- `html.dark` gets `color-scheme: dark` so native form controls, scrollbars and
  `::placeholder` match.
- Component classes use `bg-surface` (see above); everything slate-based flips
  automatically via the variables — no per-rule `dark:` overrides for slate:
  - `.card` → `bg-surface ring-slate-200/80 shadow-card`
  - `.input` → `bg-surface border-slate-300 text-slate-800 placeholder-slate-400`
  - `.label` → `text-slate-700`
  - `.btn-secondary` → `bg-surface text-slate-700 ring-slate-300`
  - `.btn-ghost` → `text-slate-600 hover:bg-slate-100`
  - `body` → `bg-slate-50 text-slate-800`
  - `.btn` adds `dark:focus:ring-offset-slate-50` so focus offsets are not white.
- Scrollbar thumb: `rgb(148 163 184 / 0.5)`; `.dark` uses `rgb(71 85 105 / 0.6)`.

### Theme module: `client/src/theme/index.js`

Mirrors `src/i18n/index.js`:

```js
export const THEME_KEY = "dalil-theme";
export const THEMES = ["light", "dark", "system"];

export function getStoredTheme()       // "light" | "dark" | null (system)
export function getSystemTheme()       // matchMedia("(prefers-color-scheme: dark)").matches
export function applyDocumentTheme(theme)  // resolve system, toggle .dark on <html>
export function setStoredTheme(theme)      // persist (or remove for "system")
export function setTheme(theme)            // applyDocumentTheme + setStoredTheme
export function initTheme()                // applyDocumentTheme(getStoredTheme())
export function subscribeSystemTheme(fn)   // matchMedia listener; returns unsubscribe
```

`initTheme()` is called in `main.jsx` (like `applyDocumentLanguage`).

### Anti-FOUC script

Inline `<script>` in `index.html` `<head>`, before the CSS loads:

```js
(function () {
  try {
    var stored = localStorage.getItem("dalil-theme");
    var dark = stored === "dark" || (!stored && matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
```

### `ThemeSwitcher.jsx`

New component `client/src/components/common/ThemeSwitcher.jsx`, styled after
`LanguageSwitcher`. Props: `{ variant = "light" }`.

- `variant="light"` (public Navbar / light dashboards): bordered white container,
  `text-slate-600`.
- `variant="dark"` (dark hero contexts if ever needed): `bg-white/10 ring-white/20`.
- Toggle: click cycles `light → dark` (system is only an initial default; once
  the user clicks, their explicit choice persists and wins). Icon: `Moon`/`Sun`.
- `aria-label={t("theme.switch")}`.
- On click: `setTheme(next)`, i18n toast optional (skip; icon is self-evident).
- Also subscribe to system theme changes while no explicit override is stored
  (only relevant before first toggle).

### Locale keys

| Key | en | ar |
|---|---|---|
| `theme.switch` | Toggle dark mode | تبديل الوضع الداكن |
| `theme.light` | Light mode | الوضع الفاتح |
| `theme.dark` | Dark mode | الوضع الداكن |

### Exception spots needing `dark:` overrides (semantic re-read)

The slate remap handles the bulk. Spots that use literal `white`, `black`,
`brand-50/100` tints, or already-dark surfaces need explicit overrides:

1. **Hard-coded `bg-white` surfaces** (survive the remap because `white` is not
   a slate variable): replaced with `bg-surface` — Navbar header, mobile menu,
   categories dropdown, Modal content, Sidebar + mobile drawer, PublicLayout
   bottom nav, EmptyState, AdminLayout/ManagerLayout headers, Dropdown panel,
   ShopFilters checkbox chip, ContactButtons. `.card`/`.input`/`.btn-secondary`
   handled via component classes.
2. **`bg-white` in hero/overlay contexts that MUST STAY white**: Home hero search
   pill (input text/placeholder forced back to dark with
   `dark:text-slate-200 dark:placeholder-slate-600`), CTA button, ShopGallery
   prev/next arrows, ShopCard copy button, ManagerGallery delete button,
   LoginPage logo circle — leave as-is.
3. **`bg-slate-900`/`bg-slate-950` already-dark elements** (must not flip to
   light): use mirror classes — ShopGallery placeholder
   (`dark:bg-slate-100`), Modal overlay (`dark:bg-slate-100/60`), Sidebar
   mobile overlay (`dark:bg-slate-100/50`), Footer (`dark:bg-slate-50`
   + `dark:border-slate-200` + mirrored text shades).
4. **Brand tints `bg-brand-50` / `bg-brand-100`** (icon chips, badges, active
   nav): `dark:bg-brand-950/40` + `text-brand-700` → `dark:text-brand-300`;
   `ring-brand-100` → `dark:ring-brand-800`; `hover:bg-brand-50` →
   `dark:hover:bg-brand-950/40`; `bg-brand-100` avatar/badge →
   `dark:bg-brand-900 dark:text-brand-200`.
5. **Status/color badges**: `bg-emerald-50 text-emerald-700 ring-emerald-200`
   → `dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30`
   (same pattern for red/amber). Solid `bg-accent-500`/`bg-emerald-500` and
   `text-red-600` icons unchanged.
6. **Shadows** (`shadow-card`, `shadow-lift`, `shadow-2xl`): invisible on dark
   — cards already carry `ring-slate-200/80` which flips; no override needed.
   Mobile drawer keeps `shadow-2xl`.
7. **Text on brand** (`.btn-primary`, `bg-brand-600`): unchanged, stays white.

## Out of scope

- A third "dark" brand theme (only light/dark/system).
- Server-side theme persistence (localStorage only).
- Image/photo brightness adjustments.

## Verification

- `npm run build` in `client` passes.
- Locale parity: no missing keys en ↔ ar.
- Manual: toggle from Navbar and Sidebar; reload persists; system-follow on first
  visit; no flash on load.

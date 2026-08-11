# Arabic Translation (Bilingual AR/EN) — Design

Date: 2026-08-08
Status: Approved by user (sections 1–3)

## Summary

Make the Dalil platform bilingual (Arabic default, English toggle) with full RTL support
and translated DB content. All pages translate: visitor side, admin panel, and manager
dashboard. Default language is Arabic; choice persists in localStorage.

## Decisions

- **Approach:** react-i18next (`i18next` + `react-i18next`). No lazy-loading; two small
  JSON files bundled by Vite.
- **Default language:** Arabic, saved in `localStorage.getItem("dalil-lang") || "ar"`.
- **RTL:** full — `document.documentElement.dir` flips to `rtl`, Arabic web font
  (Cairo or Tajawal) applied via `[dir="rtl"]`, Tailwind `rtl:`/`ltr:` variants where
  direction-sensitive spacing exists.
- **DB content:** categories and shops gain `nameAr` + `descriptionAr`. Seed scripts
  populate Arabic values. Admin/manager forms gain Arabic fields. Client picks the field
  based on current language with English fallback.
- **Server error messages:** left as-is (English, technical). Client shows translated
  generic messages where it currently surfaces raw API text.

## Section 1 — i18n foundation (client)

- Add deps: `i18next`, `react-i18next`.
- `src/i18n/index.js`: configures i18next with `en`/`ar`, `fallbackLng: "ar"`,
  `interpolation.escapeValue: false`.
- `src/i18n/locales/en.json`, `src/i18n/locales/ar.json`.
- `main.jsx`: wrap `<App />` in `<I18nextProvider>`.
- New hook/context for language state:
  - `localStorage.getItem("dalil-lang") || "ar"`
  - `setLanguage(lang)` → `i18n.changeLanguage`, set `document.documentElement.lang`
    and `.dir` (`rtl`/`ltr`), persist to localStorage.
  - Apply stored/default lang on mount before first render (avoid RTL flicker).
- Language switcher in public `Navbar` and `Footer` (AR | EN).
- `index.html`: add Arabic web font link; `index.css`: `[dir="rtl"]` font-family.
- Use Tailwind `rtl:`/`ltr:` variants for direction-sensitive spacing (`ml-*`/`mr-*`,
  `text-left`/`text-right`, `left-*`/`right-*`). Icons are not mirrored.

## Section 2 — Bilingual DB content (server)

- `Category` model: add `nameAr`, `descriptionAr` (String, default `""`).
  `toPublicJSON()` returns both `name`, `nameAr`, `description`, `descriptionAr`.
- `Shop` model: add `nameAr`, `descriptionAr` (String, default `""`).
  `toPublicJSON()` includes both.
- Seed scripts:
- `seedCategories.js`: Arabic names/descriptions for all 12 categories
  (e.g. Restaurants & Cafes → مطاعم وكافيهات).
- `seedShops.js`: Arabic names/descriptions for the 10 demo shops.
- **Existing-data note:** seed scripts are idempotent (skip existing slugs), so existing
  local DBs won't gain Arabic fields. Add a one-time backfill: seed scripts update existing
  records **only when `nameAr` is empty** (set via `findOneAndUpdate` on slug), so re-running
  `npm run seed` populates Arabic values without clobbering admin-edited Arabic names.
- Validation (`adminRoutes`): optional `nameAr`, `descriptionAr` with same length limits
  (shop name 120 / description 4000; category name 60 / description 500).
- `shopService.createShop/updateShop` and `categoryService.createCategory/updateCategory`:
  persist Arabic fields.
- Admin/manager forms:
  - `AdminCategories.jsx`, `AdminShops.jsx`, `ManagerShopEdit.jsx`: add secondary tab/
    section "Arabic name" / "Arabic description".
  - Manager still cannot rename/restatus; `nameAr`/`descriptionAr` are editable by manager.
- Client helper `localize(obj, key)` in `src/utils/i18n.js`: returns `obj[key + "Ar"]`
  when `i18n.language === "ar"` (fallback to English field if Arabic empty), else `obj[key]`.
- Replace hardcoded display sites: ShopCard, ShopDetails, CategoryShops, Home, filters,
  etc. with `localize(...)`.

## Section 3 — Formatters, dates, remaining coverage

- `formatters.js` locale-aware:
  - `formatViews` → `Intl.NumberFormat(i18n.language)`.
  - `formatTime` → `Intl.DateTimeFormat(i18n.language, { hour, minute })` (no hardcoded
    AM/PM).
  - `formatDate` → pass `i18n.language` into `toLocaleDateString`.
- Day-of-week names in `WorkingHoursTable`/`WorkingHoursEditor`: translated keys
  (`t("days.saturday")` etc.).
- Replace all hardcoded English UI strings with `t("...")` keys across all 61 files
  (public, admin, manager, shared components).
- `usePageMeta` and document title/description language-aware; update on language change.
- Server tests (`tests/api.test.js`): extend for `nameAr`/`descriptionAr` — category
  create, shop create, public API returns Arabic fields, admin update persists them.

## Out of scope

- Server API error message translation.
- Mirrored icons.
- Async chunk loading for locales.

## Verification

- `cd server && npm test` — all tests pass, including new Arabic-field tests.
- `cd client && npm run build` — succeeds.
- Manual: toggle AR/EN on home, RTL layout flips, Arabic content shows for seeded
  categories/shops, admin/manager forms show and persist Arabic fields.

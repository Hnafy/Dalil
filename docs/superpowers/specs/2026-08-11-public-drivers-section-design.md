# Public Delivery Drivers Section — Design

Date: 2026-08-11

## Overview

Show delivery drivers to the public: add a new **Drivers** section on the Home
page (after the "Latest Shops" section) with the four vehicle-type cards, and a
new public **Drivers** page at `/drivers` that lists drivers filtered by vehicle
type.

Decisions confirmed with the user:
- The Home section shows **vehicle-type cards only** (motorcycle, tuk tuk,
  private car, pickup truck) — no drivers directly on the Home page.
- Clicking a vehicle-type card opens `/drivers?vehicleType=...` (a new public
  page) that shows the drivers of that type.
- **All** drivers saved in the admin panel appear publicly — no admin toggle.
- The public Drivers page has **tabs** for the four types plus "All".
- Driver phone numbers **ARE shown publicly** on the `/drivers` cards (decision
  reversed on 2026-08-11; originally hidden for privacy).

## Approach

Follow the project's existing layered convention:

- New public `driverRoutes.js` + `driverController.js` on the server, reusing the
  existing `driverService.js` (new `listPublicDrivers` function).
- Mounted at `/api/drivers` (no auth) in `app.js`.
- New public `Drivers.jsx` page, `DriverCard.jsx` component, and a small public
  `driverService.js` on the client.
- Home section added after the Latest section in `Home.jsx`.
- Route `/drivers` added to the public layout in `AppRoutes.jsx`.
- i18n strings added to both `en.json` and `ar.json`.
- Mocha + supertest tests appended to `server/tests/api.test.js`.

## API

### `GET /api/drivers` (public, no auth)

Query params:
- `vehicleType` (optional) — one of `motorcycle`, `tuk_tuk`, `private_car`,
  `pickup_truck`. If provided and invalid → `400`.

Response `200`:

```json
{
  "success": true,
  "data": {
    "drivers": [{ "id": "...", "name": "...", "vehicleType": "motorcycle", "photo": { "url": "" } }],
    "stats": { "total": 3, "motorcycle": 1, "tuk_tuk": 1, "private_car": 1, "pickup_truck": 0 }
  }
}
```

- `drivers` sorted newest first, **no pagination** (all drivers shown).
- Driver public shape is `{ id, name, phone, vehicleType, photo }`.
- `stats` is the count of drivers per vehicle type plus a `total`.

## Backend

### Service — `driverService.js` (add)

`listPublicDrivers({ vehicleType })`:
- Build query; if `vehicleType` present, filter by it.
- One `Promise.all` for the driver list (`.sort({ createdAt: -1 })`) and the
  per-type counts (aggregate `$group`), same pattern as `listDrivers`.
- Returns `{ drivers, stats }` where each driver includes `name`, `phone`,
  `vehicleType`, and `photo`.

### Controller — `server/src/controllers/driverController.js` (new)

- `listDrivers` handler: read `vehicleType` from `req.query`, validate against the
  four allowed values (invalid → `400`), call the service, respond
  `{ success: true, data }`.

### Routes — `server/src/routes/driverRoutes.js` (new)

- `GET /` → `driverController.listDrivers` (no auth middleware).

### Mount — `server/src/app.js`

- `app.use("/api/drivers", driverRoutes);` alongside the other public routes.

## Frontend

### Public service — `client/src/services/driverService.js` (new)

- `getDrivers(params)` → `api.get("/drivers", { params }).then((res) => res.data)`.
  Reuses the existing `api` axios instance.

### Public page — `client/src/pages/public/Drivers.jsx` (new)

- Reads `vehicleType` from the URL query (`useSearchParams`).
- **Tabs**: "All" + the four vehicle types (from `VEHICLE_TYPES` constant). Clicking
  a tab sets `?vehicleType=...` in the URL (removes it for "All").
- On `vehicleType` change: `setDrivers(null)`, call `getDrivers({ vehicleType })`,
  show `SkeletonGrid` while loading.
- Driver grid (like the Shops grid): `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- `EmptyState` when a type has no drivers.
- Uses `SectionHeading`, `usePageMeta`, `useTranslation` like existing public pages.

### Card — `client/src/components/driver/DriverCard.jsx` (new)

- Circular photo when `photo.url` exists, otherwise a placeholder with the vehicle
  type emoji (from `VEHICLE_TYPES`).
- Name, and a vehicle-type badge (`badge` + `bg-brand-50 text-brand-700 ...` like
  the admin Drivers table).

### Home section — `client/src/pages/public/Home.jsx` (after Latest section)

- New `<section>` with `SectionHeading` (eyebrow + title + subtitle).
- Grid of 4 cards from `VEHICLE_TYPES` (emoji + `drivers.vehicleTypes.*` label),
  each a `Link` to `/drivers?vehicleType=<value>`.
- Card styling mirrors the Categories section cards (`card` + hover lift).
- **No API call** and no counts on the Home section.

### Routing — `client/src/routes/AppRoutes.jsx`

- Add `<Route path="/drivers" element={<Drivers />} />` inside the `PublicLayout`
  route group (before the `*` NotFound catch-all).

## i18n (`en.json`, `ar.json`)

New keys:
- `meta.drivers` — page title (e.g. "Delivery Drivers — Dalil").
- `home.driversEyebrow`, `home.driversTitle`, `home.driversSubtitle` — Home section
  heading.
- `drivers.allTypes` — "All Drivers".
- `drivers.noDriversTitle`, `drivers.noDriversSubtitle` — empty state.
- Reuse existing `drivers.vehicleTypes.*` labels.
- Add equivalent Arabic strings to `ar.json`.

## Error handling

- `400` for an invalid `vehicleType` query param (server validation).
- Client: failed fetch shows a toast (reuse `err.safeMessage` fallback) and an
  empty/retry state consistent with existing public pages.

## Testing

Append a "Public drivers" describe block to `server/tests/api.test.js`:

1. `GET /api/drivers` works **without auth** (200).
2. Returned drivers **do not include a `phone` field**.
3. Filters by `vehicleType` — only matching types returned.
4. `stats` counts are numbers and `total` matches the returned list length.
5. Invalid `vehicleType` → 400.
6. Self-contained: create a driver via the admin agent, verify it appears in the
   public list, then delete it — so the test is independent of other suites' data.

Frontend verification: `npm run build` in `client` (no errors), plus the existing
backend suite (`npm test` in `server`) still fully passes.

## Out of scope

- No admin "show on home" toggle (all drivers appear).
- No search/pagination on the public page (small expected data set).
- No changes to the admin Drivers feature or the `Driver` model.

# Durable Visitor Identity via HttpOnly Cookie

**Date:** 2026-08-13
**Status:** Approved design

## Problem

The analytics system identifies anonymous visitors with a client-generated UUID stored in `localStorage["dalil_visitor_id"]` (`client/src/utils/visitor.js`). Safari ITP evicts localStorage for sites it classifies, and it caps client-set storage for cross-site-capable pages. When the ID silently regenerates:

- "Unique views" per visitor per day are inflated (dedup key `{ shop, type, visitorId, day }` breaks).
- Any notion of a persistent visitor across visits is lost.

The identity must survive ITP and future browser privacy changes. The most future-proof available approach is a **server-issued, HttpOnly, first-party cookie** — ITP's localStorage eviction does not apply, and server-set first-party cookies are not subject to ITP's 7-day cap (unless the domain is classified as a cross-site tracker).

## Goal

Replace the localStorage `visitorId` with a server-issued, cookie-bound anonymous identity:

- **2-year cookie lifetime** (GA-style visitor window).
- **Graceful fallback** when cookies are blocked (localStorage / in-memory), so tracking still works where possible.

Existing analytics semantics are unchanged: daily view dedup, click aggregation, admin/manager dashboards, and the `Analytics` schema all stay as-is.

## Approach (chosen: 1 — dedicated ID endpoint)

The client calls `GET /api/analytics/visitor` once on first load. The server generates the ID, sets the HttpOnly cookie, and returns the ID in the body. The client caches it (memory, with localStorage fallback) and keeps sending `visitorId` in event bodies exactly as today. The server treats the cookie as authoritative; the body ID is used only when no cookie exists.

## Server changes

### New util: `server/src/utils/visitorCookie.js`

- `VISITOR_COOKIE_NAME = "dalil_visitor"`
- `visitorCookieOptions()` — 2-year `maxAge`, `httpOnly: true`, `secure: NODE_ENV === "production"`, `sameSite: NODE_ENV === "production" ? "none" : "lax"`, `path: "/"`. Mirrors the auth cookie (`generateToken.js`) so cross-origin CORS cookies keep working.

### New middleware: `attachVisitorId`

Resolution priority:

1. Valid cookie value → `req.visitorId = cookie` (authoritative).
2. Valid body `visitorId` (6–100 chars) → use it **and** promote it to the cookie (fallback path; subsequent requests converge on the cookie).
3. Otherwise → generate `crypto.randomUUID()`, set the cookie.

When the cookie is absent (paths 2 and 3), the middleware sets the cookie on the response via `res.cookie(VISITOR_COOKIE_NAME, id, visitorCookieOptions())`.

### New endpoint

- `GET /api/analytics/visitor` — behind the existing `analyticsLimiter` (60 req/min); runs `attachVisitorId`; returns `{ success: true, data: { visitorId: req.visitorId } }`.

### Event recording changes

- `server/src/routes/analyticsRoutes.js`: apply `attachVisitorId` to `POST /view` and `POST /click`; make body `visitorId` **optional** (`optional().trim().isLength({ min: 6, max: 100 })`) since the cookie is authoritative.
- `server/src/controllers/analyticsController.js`: pass `req.visitorId` into the service instead of `req.body.visitorId`.

No changes to `analyticsService.js`, the `Analytics` model, or the admin/manager analytics read endpoints.

## Client changes

### `client/src/utils/visitor.js`

- Add async, memoized `ensureVisitorId()`: returns a cached in-memory ID if present; otherwise calls `GET /api/analytics/visitor`, caches the returned ID in memory + localStorage (fallback), and returns it. A single shared promise prevents duplicate round-trips when multiple call sites race.
- Keep `getVisitorId()` as a synchronous offline/localStorage fallback.

### `client/src/services/analyticsService.js`

- Add `getVisitorId()` → `api.get("/analytics/visitor").then((res) => res.data.data.visitorId)`. (`res.data` is the axios payload `{ success, data: { visitorId } }`; the service extracts the ID.)

### Call sites

- `client/src/pages/public/ShopDetails.jsx` (view event) and `client/src/components/shop/ContactButtons.jsx` (click events): use `ensureVisitorId().then((id) => recordView(id) / recordClick(id))`. Fire-and-forget errors as today.

## Testing

Server tests (`server/tests/api.test.js`, "Analytics" block):

1. `GET /api/analytics/visitor` returns a `visitorId` (6–100 chars) and sets a `Set-Cookie` header with `HttpOnly`, `Max-Age` ≈ 2 years, and correct `SameSite`/`Secure` flags.
2. Calling again with the returned cookie yields the **same** `visitorId`.
3. `POST /view` and `POST /click` succeed **without** a body `visitorId` when the cookie is present; recorded with the cookie ID.
4. `POST /view` with a valid body `visitorId` and no cookie: sets the cookie to that value and records it (promotion).
5. Existing analytics tests (body `visitorId` still accepted) continue to pass.

Client: `npm run build` must pass (no lint script exists).

## Privacy

Fully anonymous: a random UUID per browser. No PII, no fingerprinting, no IP/user-agent capture, no consent gate added. Existing `Analytics.visitorId` values remain valid; no data migration.

## Trade-offs / assumptions

- **Cross-site in prod:** the analytics cookie mirrors auth's `sameSite: "none"` in prod so it is sent on the existing cross-origin CORS setup. Caveat: a `SameSite=None` first-party cookie is the one ITP-classification vector that could cap it at 7 days in Safari. If the prod API ever moves to the same site as the frontend, flip to `"lax"` to make it fully ITP-immune. Flagged as a documented follow-up, not in scope now.
- **Multiple tabs:** each tab may briefly hold a different in-memory ID; the cookie wins server-side, so metrics converge on one canonical ID per browser. Acceptable.
- No changes to dashboards, admin/manager analytics endpoints, or the `Analytics` schema.

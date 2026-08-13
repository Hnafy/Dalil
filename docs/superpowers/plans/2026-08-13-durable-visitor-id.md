# Durable Visitor ID via HttpOnly Cookie — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the localStorage `visitorId` with a server-issued, HttpOnly-cookie-bound anonymous identity (2-year life) that survives Safari ITP, with graceful fallback when cookies are blocked.

**Architecture:** A new `GET /api/analytics/visitor` endpoint sets a `dalil_visitor` HttpOnly cookie and returns the ID. A `attachVisitorId` middleware resolves the canonical ID (cookie → body → generated) and is applied to the visitor endpoint plus `/view` and `/click`. The client calls `ensureVisitorId()` once (memoized), caches the result, and keeps sending `visitorId` in event bodies as a fallback channel.

**Tech Stack:** Express + Mongoose (server), React + Vite + axios (client), Mocha + supertest (server tests). No client test framework exists — client changes are verified via `npm run build`.

**Spec:** `docs/superpowers/specs/2026-08-13-durable-visitor-id-design.md`

---

### Task 1: Server — visitor cookie util, middleware, and ID endpoint

**Files:**
- Create: `server/src/utils/visitorCookie.js`
- Create: `server/src/middleware/visitorMiddleware.js`
- Modify: `server/src/controllers/analyticsController.js` (add `getVisitor`)
- Modify: `server/src/routes/analyticsRoutes.js` (add `GET /visitor`)
- Test: `server/tests/api.test.js` (new `describe("Visitor identity")` block — note: this file is gitignored by project convention)

- [ ] **Step 1: Write the failing tests**

Append a new describe block to `server/tests/api.test.js`, right after the existing `describe("Analytics events", ...)` block:

```js
describe("Visitor identity", () => {
  it("issues an HttpOnly 2-year visitor cookie", async () => {
    const res = await request(app).get("/api/analytics/visitor");
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.visitorId.length >= 6 && res.body.data.visitorId.length <= 100);
    const setCookie = res.headers["set-cookie"]?.[0] || "";
    assert.ok(setCookie.includes("dalil_visitor="), "cookie name set");
    assert.ok(setCookie.includes("HttpOnly"), "cookie is HttpOnly");
    assert.ok(setCookie.includes("Max-Age=63072000"), "cookie lasts 2 years");
    assert.ok(setCookie.includes("Path=/"), "cookie path is /");
  });

  it("reuses an existing visitor cookie", async () => {
    const agent = request.agent(app);
    const first = await agent.get("/api/analytics/visitor");
    const second = await agent.get("/api/analytics/visitor");
    assert.strictEqual(first.status, 200);
    assert.strictEqual(second.body.data.visitorId, first.body.data.visitorId);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test 2>&1 | Select-String -Pattern "passing|failing|1)"`
Expected: FAIL — `GET /api/analytics/visitor` returns 404 (route doesn't exist yet).

- [ ] **Step 3: Create the cookie util**

Create `server/src/utils/visitorCookie.js`:

```js
const VISITOR_COOKIE_NAME = "dalil_visitor";
const VISITOR_COOKIE_MAX_AGE_MS = 2 * 365 * 24 * 60 * 60 * 1000; // 2 years

function visitorCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: VISITOR_COOKIE_MAX_AGE_MS,
    path: "/",
  };
}

function isValidVisitorId(value) {
  return typeof value === "string" && value.trim().length >= 6 && value.trim().length <= 100;
}

module.exports = { VISITOR_COOKIE_NAME, visitorCookieOptions, isValidVisitorId };
```

- [ ] **Step 4: Create the middleware**

Create `server/src/middleware/visitorMiddleware.js`:

```js
const crypto = require("crypto");
const { VISITOR_COOKIE_NAME, visitorCookieOptions, isValidVisitorId } = require("../utils/visitorCookie");

const attachVisitorId = (req, res, next) => {
  const cookieValue = req.cookies[VISITOR_COOKIE_NAME];
  if (isValidVisitorId(cookieValue)) {
    req.visitorId = cookieValue.trim();
    return next();
  }

  const bodyValue = req.body && req.body.visitorId;
  if (isValidVisitorId(bodyValue)) {
    req.visitorId = bodyValue.trim();
    res.cookie(VISITOR_COOKIE_NAME, req.visitorId, visitorCookieOptions());
    return next();
  }

  req.visitorId = crypto.randomUUID();
  res.cookie(VISITOR_COOKIE_NAME, req.visitorId, visitorCookieOptions());
  next();
};

module.exports = { attachVisitorId };
```

- [ ] **Step 5: Add the controller method**

Edit `server/src/controllers/analyticsController.js` — replace the entire file content with:

```js
const analyticsService = require("../services/analyticsService");
const { asyncHandler } = require("../middleware/errorHandler");

const getVisitor = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { visitorId: req.visitorId } });
});

const recordView = asyncHandler(async (req, res) => {
  const { shopId } = req.body;
  await analyticsService.recordView(shopId, req.visitorId);
  res.json({ success: true, data: { recorded: true } });
});

const recordClick = asyncHandler(async (req, res) => {
  const { shopId, type } = req.body;
  await analyticsService.recordClick(shopId, req.visitorId, type);
  res.json({ success: true, data: { recorded: true } });
});

module.exports = { getVisitor, recordView, recordClick };
```

- [ ] **Step 6: Add the route**

Edit `server/src/routes/analyticsRoutes.js` — add the require and the `GET /visitor` route. The file becomes:

```js
const express = require("express");
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");
const analyticsController = require("../controllers/analyticsController");
const { runValidation } = require("../middleware/validateMiddleware");
const { attachVisitorId } = require("../middleware/visitorMiddleware");

const router = express.Router();

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please slow down." },
});

const eventValidators = [
  body("shopId").isMongoId().withMessage("Valid shop id is required."),
  body("visitorId").optional({ checkFalsy: true }).trim().isLength({ min: 6, max: 100 }).withMessage("A visitor id is required."),
];

const clickValidators = [
  ...eventValidators,
  body("type")
    .isIn(["phone_click", "whatsapp_click", "maps_click", "website_click", "facebook_click", "instagram_click", "tiktok_click"])
    .withMessage("Invalid click type."),
];

router.get("/visitor", analyticsLimiter, attachVisitorId, analyticsController.getVisitor);
router.post("/view", analyticsLimiter, attachVisitorId, eventValidators, runValidation, analyticsController.recordView);
router.post("/click", analyticsLimiter, attachVisitorId, clickValidators, runValidation, analyticsController.recordClick);

module.exports = router;
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm test 2>&1 | Select-String -Pattern "passing|failing"`
Expected: all pass (52 passing: 50 + 2 new). The existing "Analytics events" tests still pass — the middleware promotes their body `visitorId` and returns 200.

- [ ] **Step 8: Commit**

```bash
git add server/src/utils/visitorCookie.js server/src/middleware/visitorMiddleware.js server/src/controllers/analyticsController.js server/src/routes/analyticsRoutes.js
git commit -m "feat(server): issue durable visitor id via HttpOnly cookie endpoint"
```

---

### Task 2: Server — cookie-aware event recording

**Files:**
- Modify: `server/src/routes/analyticsRoutes.js` (already updated in Task 1)
- Modify: `server/src/controllers/analyticsController.js` (already updated in Task 1)
- Test: `server/tests/api.test.js`

> Note: Tasks 1's Steps 5–6 already wired `/view` and `/click` through `attachVisitorId` and made the body `visitorId` optional. This task adds the two behavioral tests that prove the middleware's cookie authority + promotion, and confirms the full suite.

- [ ] **Step 1: Write the failing behavioral tests**

Append inside the `describe("Visitor identity", ...)` block (after the "reuses an existing visitor cookie" test):

```js
  it("records a view with no body visitor id when the cookie is present", async () => {
    const agent = request.agent(app);
    await agent.get("/api/analytics/visitor");
    const res = await agent.post("/api/analytics/view").send({ shopId: ctx.shop._id.toString() });
    assert.strictEqual(res.status, 200);
  });

  it("promotes a body visitor id into the cookie when no cookie exists", async () => {
    const res = await request(app)
      .post("/api/analytics/view")
      .send({ shopId: ctx.shop._id.toString(), visitorId: "promo-visitor-001" });
    assert.strictEqual(res.status, 200);
    const setCookie = res.headers["set-cookie"]?.[0] || "";
    assert.ok(setCookie.includes("dalil_visitor=promo-visitor-001"), "body id promoted to cookie");
  });
```

- [ ] **Step 2: Run the tests to verify they pass**

Run: `npm test 2>&1 | Select-String -Pattern "passing|failing"`
Expected: all pass (54 passing: 52 + 2 new).

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/analyticsRoutes.js server/src/controllers/analyticsController.js
git commit -m "test(server): cover cookie-authority and body-id promotion for analytics events"
```

---

### Task 3: Client — server-backed visitor ID service

**Files:**
- Modify: `client/src/services/analyticsService.js`
- Modify: `client/src/utils/visitor.js`

> No client test framework exists. Verification is `npm run build`.

- [ ] **Step 1: Add the fetch function to analyticsService**

Edit `client/src/services/analyticsService.js` — the file becomes:

```js
import api from "./api";

export const recordView = (shopId, visitorId) =>
  api.post("/analytics/view", { shopId, visitorId }).then((res) => res.data);

export const recordClick = (shopId, visitorId, type) =>
  api.post("/analytics/click", { shopId, visitorId, type }).then((res) => res.data);

export const fetchVisitorId = () => api.get("/analytics/visitor").then((res) => res.data.data.visitorId);
```

- [ ] **Step 2: Rewrite visitor.js with ensureVisitorId**

Replace `client/src/utils/visitor.js` entirely with:

```js
import { fetchVisitorId } from "../services/analyticsService";

const VISITOR_KEY = "dalil_visitor_id";
let cachedId = null;
let pendingPromise = null;

export function getVisitorId() {
  if (cachedId) return cachedId;
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `v-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    cachedId = id;
    return id;
  } catch {
    return `v-${Date.now()}`;
  }
}

export function ensureVisitorId() {
  if (cachedId) return Promise.resolve(cachedId);
  if (pendingPromise) return pendingPromise;
  pendingPromise = fetchVisitorId()
    .then((id) => {
      cachedId = id;
      try {
        localStorage.setItem(VISITOR_KEY, id);
      } catch {
        // storage unavailable — in-memory only
      }
      return id;
    })
    .catch(() => {
      cachedId = getVisitorId();
      return cachedId;
    })
    .finally(() => {
      pendingPromise = null;
    });
  return pendingPromise;
}
```

- [ ] **Step 3: Verify the build passes**

Run: `npm run build 2>$null; echo "EXIT: $LASTEXITCODE"` (from `client/`)
Expected: `EXIT: 0`

- [ ] **Step 4: Commit**

```bash
git add client/src/services/analyticsService.js client/src/utils/visitor.js
git commit -m "feat(client): fetch server-issued visitor id with local fallback"
```

---

### Task 4: Client — use ensureVisitorId at event call sites

**Files:**
- Modify: `client/src/pages/public/ShopDetails.jsx` (lines 6, 38)
- Modify: `client/src/components/shop/ContactButtons.jsx` (lines 15, 43, 45–47)

- [ ] **Step 1: Update ShopDetails.jsx**

Edit `client/src/pages/public/ShopDetails.jsx`:
- Line 6: change `import { getVisitorId } from "../../utils/visitor";` to `import { ensureVisitorId } from "../../utils/visitor";`
- Line 38: change `recordView(res.data.id, getVisitorId()).catch(() => {});` to:

```js
        ensureVisitorId().then((id) => recordView(res.data.id, id)).catch(() => {});
```

- [ ] **Step 2: Update ContactButtons.jsx**

Edit `client/src/components/shop/ContactButtons.jsx`:
- Line 15: change `import { getVisitorId } from "../../utils/visitor";` to `import { ensureVisitorId } from "../../utils/visitor";`
- Line 43: remove the line `const visitorId = getVisitorId();`
- Lines 45–47: change the `track` function to:

```js
  const track = (type) => {
    ensureVisitorId().then((id) => recordClick(shop.id, id, type)).catch(() => {});
  };
```

- [ ] **Step 3: Verify the build passes**

Run: `npm run build 2>$null; echo "EXIT: $LASTEXITCODE"` (from `client/`)
Expected: `EXIT: 0`

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/public/ShopDetails.jsx client/src/components/shop/ContactButtons.jsx
git commit -m "feat(client): track views and clicks with server-issued visitor id"
```

---

### Task 5: End-to-end verification

**Files:**
- None (verification only)

- [ ] **Step 1: Run the full server suite**

Run: `npm test 2>&1 | Select-String -Pattern "passing|failing"`
Expected: `54 passing`, 0 failing.

- [ ] **Step 2: Run the client build**

Run: `npm run build 2>$null; echo "EXIT: $LASTEXITCODE"` (from `client/`)
Expected: `EXIT: 0`

- [ ] **Step 3: Manual smoke checklist (requires dev servers + browser)**

1. `cd server && npm run dev` and `cd client && npm run dev`.
2. Open a shop page in Safari (or Chrome devtools → Application → Cookies).
3. Confirm a `dalil_visitor` cookie exists with `HttpOnly` checked and `Max-Age` ~2 years.
4. Reload the page; view + contact clicks fire and the same cookie ID is used.
5. Open the same shop in a private window — analytics still records (fresh cookie), no console errors.

- [ ] **Step 4: Confirm clean working tree**

Run: `git status --porcelain`
Expected: empty (all changes committed).

---

## Self-Review Notes

- **Spec coverage:** cookie util + options (Task 1), `attachVisitorId` middleware (Task 1), `GET /api/analytics/visitor` (Task 1), optional body visitorId + cookie authority on `/view`/`/click` (Tasks 1–2), client `ensureVisitorId` memoized + localStorage fallback (Task 3), call-site updates (Task 4), tests incl. promotion + cookie reuse + 2-year Max-Age (Tasks 1–2), privacy (no new data captured — nothing to test), trade-off documented (no code change).
- **Placeholder scan:** no TBD/TODO; every code step shows full file content or exact edits.
- **Type consistency:** `req.visitorId` set in middleware, read in both controllers; service names `fetchVisitorId` / `ensureVisitorId` / `getVisitorId` are distinct and used consistently across Tasks 3–4.

# Arabic Translation (Bilingual AR/EN) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Dalil platform bilingual (Arabic default, English toggle) with full RTL support and translated DB content across visitor, admin, and manager surfaces.

**Architecture:** Server gains `nameAr`/`descriptionAr` on Category and Shop (returned by `toPublicJSON`, persisted via services, backfilled by idempotent seed scripts). Client adds react-i18next with two bundled locale JSONs, a language switcher that flips `document.documentElement.dir` to `rtl`, a `localize()` helper for DB content, locale-aware formatters, and `t()` keys replacing every hardcoded UI string.

**Tech Stack:** React 18 + Vite + Tailwind 3 (client), Express + Mongoose + Mocha/supertest (server), `i18next` + `react-i18next`.

**Reference spec:** `docs/superpowers/specs/2026-08-08-arabic-translation-design.md`

---

## Environment Facts (context for the implementer)

- **No git repo** at `D:\dalil` — there is no `git add/commit` in this project. Skip commit steps (they are noted as optional in tasks).
- Server tests run against a throwaway DB: `mongodb://localhost:27017/dalil_test` (`TEST_MONGO_URI` overrides). Run from `D:\dalil\server`: `npm test`.
- Dev DB is `mongodb://localhost:27017/dalil` (from `.env`). Seed: `npm run seed` (idempotent). A dev server may already be running on `:5000`.
- Client builds with `npm run build` from `D:\dalil\client`.
- Existing test suite: 29 passing (`server/tests/api.test.js`). New Arabic tests must not break these.
- Server is CommonJS. Client is ESM.
- Server `JWT_SECRET`, `MONGO_URI` live in `server/.env`. Tests already call `require("dotenv").config()`.

## File Map

### Server — new/modified
| File | Responsibility |
|---|---|
| `src/models/Category.js` | add `nameAr`, `descriptionAr`; `toPublicJSON()` returns them |
| `src/models/Shop.js` | add `nameAr`, `descriptionAr`; `toPublicJSON()` returns them |
| `src/services/categoryService.js` | create/update persist Arabic fields |
| `src/services/shopService.js` | create/update persist Arabic fields; populate selects include `nameAr` |
| `src/controllers/managerController.js` | `updateMyShop` allowed list adds `nameAr`, `descriptionAr`; `getMyShop` populate adds `nameAr` |
| `src/routes/adminRoutes.js` | optional `nameAr`/`descriptionAr` validation on shop + category create/update |
| `src/routes/managerRoutes.js` | optional `nameAr`/`descriptionAr` validation on PATCH /shop |
| `src/services/analyticsService.js` | topShops + manager shop payload include `nameAr` |
| `src/scripts/seedCategories.js` | Arabic values + empty-only backfill |
| `src/scripts/seedShops.js` | Arabic values + empty-only backfill |
| `tests/api.test.js` | new Arabic-field tests; fixtures gain Arabic fields |

### Client — new/modified
| File | Responsibility |
|---|---|
| `src/i18n/index.js` (new) | i18next init, `getStoredLang`, `setStoredLang`, `applyDocumentLanguage`, `changeLanguage` |
| `src/i18n/locales/en.json` (new) | English UI strings |
| `src/i18n/locales/ar.json` (new) | Arabic UI strings |
| `src/utils/i18n.js` (new) | `localize(obj, key)` DB-content picker |
| `src/components/common/LanguageSwitcher.jsx` (new) | AR/EN toggle (light/dark variants) |
| `src/main.jsx` | `I18nextProvider`, pre-render `applyDocumentLanguage` |
| `index.html` | Arabic font preconnect/link, default lang/dir |
| `src/index.css` | `[dir="rtl"]` font-family |
| `tailwind.config.js` | add Cairo to `fontFamily.sans` |
| `src/hooks/usePageMeta.js` | language-aware fallbacks, re-runs on lang change |
| `src/utils/formatters.js` | locale-aware `formatViews/formatTime/formatDate` |
| `src/utils/constants.js` | `DAYS` lose hardcoded labels (keys only) |
| all components/pages/layouts in `src/` | `t()` keys; `localize()` for DB content; `rtl:`/`ltr:` where direction-sensitive |

---

## Phase 1 — Server: bilingual DB content (TDD)

### Task 1: Extend the test suite for Arabic fields (red)

**Files:**
- Modify: `D:\dalil\server\tests\api.test.js`

- [ ] **Step 1: Add Arabic fields to the fixtures in `before()`**

In the `before()` hook, add `nameAr`/`descriptionAr` to the category and shop fixtures (lines ~34 and ~35-47):

```js
const cat = await Category.create({ name: "Restaurants", nameAr: "مطاعم", slug: "restaurants", icon: "Utensils", description: "Food", descriptionAr: "أكل", isActive: true });
const shop = await Shop.create({
  name: "Test Kitchen",
  nameAr: "مطبخ تجريبي",
  slug: "test-kitchen",
  category: cat._id,
  description: "Fresh food",
  descriptionAr: "طعام طازج",
  phone: "+20 100 000 0000",
  whatsapp: "+20 100 000 0000",
  address: "Main St",
  googleMapsUrl: "",
  status: "active",
  workingHours: hours(),
  images: [{ url: "https://example.com/a.jpg", publicId: "" }],
});
```

- [ ] **Step 2: Add new tests to the "Health & public API" describe block** (after the existing `GET /api/shops/:slug hides inactive shops` test)

```js
it("GET /api/shops/:slug returns Arabic fields", async () => {
  const res = await request(app).get("/api/shops/test-kitchen");
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.nameAr, "مطبخ تجريبي");
  assert.strictEqual(res.body.data.descriptionAr, "طعام طازج");
  assert.strictEqual(res.body.data.category.nameAr, "مطاعم");
});

it("GET /api/categories returns Arabic fields", async () => {
  const res = await request(app).get("/api/categories");
  assert.strictEqual(res.status, 200);
  const cat = res.body.data.categories.find((c) => c.slug === "restaurants");
  assert.ok(cat, "restaurants category present");
  assert.strictEqual(cat.nameAr, "مطاعم");
  assert.strictEqual(cat.descriptionAr, "أكل");
});
```

- [ ] **Step 3: Add new tests to the "Admin panel" describe block** (after the existing `creates a category and dedupes slugs` test)

```js
it("creates a shop with Arabic fields", async () => {
  const res = await agent.post("/api/admin/shops").send({
    name: "Arabic Diner",
    nameAr: "مطعم عربي",
    description: "A diner",
    descriptionAr: "مطعم شعبي",
    category: ctx.cat._id.toString(),
    status: "active",
  });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.data.shop.nameAr, "مطعم عربي");
  assert.strictEqual(res.body.data.shop.descriptionAr, "مطعم شعبي");
  ctx.dinerAr = res.body.data.shop;
});

it("updates a shop's Arabic fields", async () => {
  const res = await agent.patch(`/api/admin/shops/${ctx.shop._id}`).send({
    descriptionAr: "وصف محدث",
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.shop.descriptionAr, "وصف محدث");
});

it("creates a category with Arabic fields", async () => {
  const res = await agent.post("/api/admin/categories").send({
    name: "Cafes",
    nameAr: "كافيهات",
    description: "Coffee shops",
    descriptionAr: "مقاهي",
  });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.data.category.nameAr, "كافيهات");
  assert.strictEqual(res.body.data.category.descriptionAr, "مقاهي");
});
```

- [ ] **Step 4: Add a new test to the "Manager dashboard" describe block** (after the existing `manager cannot rename or re-status their shop` test)

```js
it("manager can update Arabic fields", async () => {
  const res = await agent.patch("/api/manager/shop").send({
    nameAr: "مطبخ تجريبي",
    descriptionAr: "وصف بالعربية",
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.shop.nameAr, "مطبخ تجريبي");
  assert.strictEqual(res.body.data.shop.descriptionAr, "وصف بالعربية");
});
```

- [ ] **Step 5: Run the suite to confirm the new tests fail**

Run (from `D:\dalil\server`): `npm test`
Expected: 29 pass, 6 new fail — e.g. `AssertionError [ERR_ASSERTION]: undefined == 'مطبخ تجريبي'` because `toPublicJSON` does not yet return `nameAr`.

---

### Task 2: Add Arabic fields to the Category and Shop models

**Files:**
- Modify: `D:\dalil\server\src\models\Category.js`
- Modify: `D:\dalil\server\src\models\Shop.js`

- [ ] **Step 1: Category schema + `toPublicJSON`**

Add to the schema (after `description`, before `icon`):

```js
nameAr: { type: String, default: "", trim: true, maxlength: 60 },
descriptionAr: { type: String, default: "", maxlength: 500 },
```

Return them in `toPublicJSON`:

```js
categorySchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    nameAr: this.nameAr,
    slug: this.slug,
    description: this.description,
    descriptionAr: this.descriptionAr,
    icon: this.icon,
    isActive: this.isActive,
  };
};
```

- [ ] **Step 2: Shop schema + `toPublicJSON`**

Add to the schema (after `description`, before `category`):

```js
nameAr: { type: String, default: "", trim: true, maxlength: 120 },
descriptionAr: { type: String, default: "", maxlength: 4000 },
```

Return them in `toPublicJSON`:

```js
shopSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    nameAr: this.nameAr,
    slug: this.slug,
    description: this.description,
    descriptionAr: this.descriptionAr,
    category: this.category,
    phone: this.phone,
    whatsapp: this.whatsapp,
    address: this.address,
    latitude: this.latitude,
    longitude: this.longitude,
    googleMapsUrl: this.googleMapsUrl,
    socialLinks: this.socialLinks,
    workingHours: this.workingHours,
    images: this.images,
    status: this.status,
    views: this.views,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};
```

---

### Task 3: Persist Arabic fields in services + populate `nameAr` on category references

**Files:**
- Modify: `D:\dalil\server\src\services\categoryService.js`
- Modify: `D:\dalil\server\src\services\shopService.js`

- [ ] **Step 1: `categoryService.createCategory`**

```js
async function createCategory({ name, nameAr, description, descriptionAr, icon, isActive }) {
  const slug = await uniqueSlug(name);
  return Category.create({
    name,
    nameAr: nameAr || "",
    description: description || "",
    descriptionAr: descriptionAr || "",
    icon: icon || "Store",
    isActive: isActive !== false,
    slug,
  });
}
```

- [ ] **Step 2: `categoryService.updateCategory`**

```js
async function updateCategory(id, { name, nameAr, description, descriptionAr, icon, isActive }) {
  const cat = await Category.findById(id);
  if (!cat) throw new AppError(404, "Category not found.");
  if (name !== undefined && String(name).trim() !== cat.name) {
    cat.name = String(name).trim();
    cat.slug = await uniqueSlug(cat.name);
  }
  if (nameAr !== undefined) cat.nameAr = nameAr;
  if (description !== undefined) cat.description = description;
  if (descriptionAr !== undefined) cat.descriptionAr = descriptionAr;
  if (icon !== undefined) cat.icon = icon;
  if (isActive !== undefined) cat.isActive = isActive;
  await cat.save();
  return cat;
}
```

- [ ] **Step 3: `shopService.createShop`** — add to the `payload` object (after `description`):

```js
nameAr: data.nameAr || "",
descriptionAr: data.descriptionAr || "",
```

- [ ] **Step 4: `shopService.updateShop`** — add to the `fields` array:

```js
const fields = ["description", "descriptionAr", "phone", "whatsapp", "address", "latitude", "longitude", "googleMapsUrl", "status"];
```

And handle `nameAr` next to the existing `name` rename block:

```js
if (data.nameAr !== undefined) shop.nameAr = data.nameAr;
```

- [ ] **Step 5: Add `nameAr` to every category `populate(...)` select** in `shopService.js`

Replace these three lines:

```js
.populate("category", "name slug icon")
```
→
```js
.populate("category", "name nameAr slug icon")
```

and:

```js
const shop = await Shop.findOne(query).populate("category", "name slug icon description");
```
→
```js
const shop = await Shop.findOne(query).populate("category", "name nameAr slug icon description");
```

These occur in `listShops` (line ~70), `getShopBySlug` (line ~102), `getShopById` (line ~108), and `listShopsForAdmin` (line ~228). Apply to all four.

- [ ] **Step 6: Run the suite**

Run: `npm test`
Expected: all green (35 passing). If `manager can update Arabic fields` still fails, you haven't done Task 4 yet — continue.

---

### Task 4: Allow managers to edit Arabic fields + analytics payload includes `nameAr`

**Files:**
- Modify: `D:\dalil\server\src\controllers\managerController.js`
- Modify: `D:\dalil\server\src\routes\managerRoutes.js`
- Modify: `D:\dalil\server\src\routes\adminRoutes.js`
- Modify: `D:\dalil\server\src\services\analyticsService.js`

- [ ] **Step 1: `managerController.updateMyShop` allowed list**

```js
const allowed = ["description", "descriptionAr", "phone", "whatsapp", "address", "latitude", "longitude", "googleMapsUrl", "nameAr"];
```

Note: `name` and `status` stay excluded — managers cannot rename or re-status.

- [ ] **Step 2: `managerController.getMyShop` populate**

```js
const shop = await Shop.findById(shopId).populate("category", "name nameAr slug icon");
```

- [ ] **Step 3: `managerRoutes.js` PATCH /shop validators** — add after the `description` validator:

```js
body("nameAr").optional().trim().isLength({ max: 120 }),
body("descriptionAr").optional().isLength({ max: 4000 }),
```

- [ ] **Step 4: `adminRoutes.js` shop validators**

POST `/shops` — add after `body("name")...`:

```js
body("nameAr").optional().trim().isLength({ max: 120 }),
body("descriptionAr").optional().isLength({ max: 4000 }),
```

PATCH `/shops/:id` currently only has `idParam`. Give it the same optional validators:

```js
router.patch(
  "/shops/:id",
  idParam,
  [
    body("name").optional().trim().isLength({ max: 120 }),
    body("nameAr").optional().trim().isLength({ max: 120 }),
    body("description").optional().isLength({ max: 4000 }),
    body("descriptionAr").optional().isLength({ max: 4000 }),
    body("status").optional().isIn(["active", "inactive"]).withMessage("Invalid status."),
  ],
  runValidation,
  adminController.updateShop
);
```

- [ ] **Step 5: `adminRoutes.js` category validators**

POST `/categories` — add after `body("name")...`:

```js
body("nameAr").optional().trim().isLength({ max: 60 }),
body("descriptionAr").optional().isLength({ max: 500 }),
```

PATCH `/categories/:id` — add the same two optional validators to its array.

- [ ] **Step 6: `analyticsService.js`** — include `nameAr`

In `getAdminOverview` topShops projection (line ~115):

```js
$project: { _id: 0, shopId: "$shop._id", name: "$shop.name", nameAr: "$shop.nameAr", slug: "$shop.slug", views: "$total" },
```

In `getManagerOverview` shop payload (line ~165):

```js
shop: { id: shop._id, name: shop.name, nameAr: shop.nameAr, slug: shop.slug, views: shop.views },
```

- [ ] **Step 7: Run the full suite**

Run: `npm test`
Expected: 35 passing, 0 failing.

- [ ] **Step 8 (optional, no git):** commit point if a repo existed.

---

### Task 5: Seed categories with Arabic + empty-only backfill

**Files:**
- Modify: `D:\dalil\server\src\scripts\seedCategories.js`

- [ ] **Step 1: Add `nameAr`/`descriptionAr` to every entry**

Add to each of the 12 category objects (keep existing English fields):

```js
{ name: "Restaurants & Cafes", nameAr: "مطاعم وكافيهات", description: "Restaurants, cafes, and food spots", descriptionAr: "مطاعم ومقاهٍ وأماكن طعام", icon: "Utensils" },
{ name: "Groceries & Markets", nameAr: "بقالة وأسواق", description: "Supermarkets and grocery stores", descriptionAr: "سوبر ماركت ومحلات بقالة", icon: "ShoppingCart" },
{ name: "Fashion & Clothing", nameAr: "أزياء وملابس", description: "Clothing and fashion shops", descriptionAr: "محلات الملابس والأزياء", icon: "Shirt" },
{ name: "Beauty & Salons", nameAr: "تجميل وصالونات", description: "Hair salons and beauty centers", descriptionAr: "صالونات الشعر ومراكز التجميل", icon: "Scissors" },
{ name: "Pharmacies & Health", nameAr: "صيدليات وصحة", description: "Pharmacies and health services", descriptionAr: "صيدليات وخدمات صحية", icon: "Pill" },
{ name: "Electronics", nameAr: "إلكترونيات", description: "Electronics and mobile shops", descriptionAr: "محلات الإلكترونيات والموبايل", icon: "MonitorSmartphone" },
{ name: "Services & Repair", nameAr: "خدمات وصيانة", description: "Repair and professional services", descriptionAr: "خدمات الإصلاح والخدمات المهنية", icon: "Wrench" },
{ name: "Bakery & Sweets", nameAr: "مخابز وحلويات", description: "Bakeries and sweet shops", descriptionAr: "مخابز ومحلات الحلويات", icon: "Croissant" },
{ name: "Home & Furniture", nameAr: "منزل وأثاث", description: "Furniture and home supplies", descriptionAr: "الأثاث ومستلزمات المنزل", icon: "Sofa" },
{ name: "Education", nameAr: "تعليم", description: "Tutoring and education centers", descriptionAr: "مراكز الدروس والتعليم", icon: "GraduationCap" },
{ name: "Sports & Fitness", nameAr: "رياضة ولياقة", description: "Gyms and sports services", descriptionAr: "نوادٍ رياضية وخدمات اللياقة", icon: "Dumbbell" },
{ name: "Pets", nameAr: "حيوانات أليفة", description: "Pet stores and pet services", descriptionAr: "محلات وخدمات الحيوانات الأليفة", icon: "PawPrint" },
```

- [ ] **Step 2: Replace the seed loop with backfill-on-empty logic**

Replace the whole `for (const c of categories)` block:

```js
for (const c of categories) {
  const slug = makeSlug(c.name);
  const existing = await Category.findOne({ slug });
  if (existing) {
    const update = {};
    if (!existing.nameAr) update.nameAr = c.nameAr;
    if (!existing.descriptionAr) update.descriptionAr = c.descriptionAr;
    if (Object.keys(update).length > 0) {
      await Category.updateOne({ _id: existing._id }, { $set: update });
      backfilled += 1;
    } else {
      skipped += 1;
    }
    continue;
  }
  await Category.create({ ...c, slug });
  created += 1;
}
```

Update the counters declaration and log line:

```js
let created = 0;
let skipped = 0;
let backfilled = 0;
```

```js
console.log(`Categories seed done -> ${created} created, ${backfilled} backfilled, ${skipped} already complete.`);
```

---

### Task 6: Seed shops with Arabic + empty-only backfill

**Files:**
- Modify: `D:\dalil\server\src\scripts\seedShops.js`

- [ ] **Step 1: Add `nameAr`/`descriptionAr` to each of the 10 shop objects**

Add the two fields to each object (values shown — the rest of each object stays unchanged):

```js
// Al-Tayeb Restaurant
nameAr: "مطعم الطيب",
descriptionAr: "أطباق مصرية أصيلة، مشويات ولحوم طازجة. خدمة داخل المطعم أو أخذها معك.",
// Abou Ghaleb Supermarket
nameAr: "سوبر ماركت أبو غالب",
descriptionAr: "بقالة يومية وخضروات طازجة وألبان ومستلزمات منزلية بأسعار مناسبة.",
// Al-Nour Bakery
nameAr: "مخبز النور",
descriptionAr: "عيش بلدي طازج وكرواسون وحلويات مصرية تقليدية تُخبز يوميًا من الصباح الباكر.",
// Rose Beauty Salon
nameAr: "صالون روز للتجميل",
descriptionAr: "تصفيف وصبغ شعر ومانيكير وباقات عرائس على يد خبراء.",
// Al-Shifa Pharmacy
nameAr: "صيدلية الشفاء",
descriptionAr: "أدوية ومستلزمات طبية واستشارات صيدلانية. مفتوحة يوميًا.",
// Galaxy Electronics
nameAr: "جالاكسي للإلكترونيات",
descriptionAr: "موبايلات واكسسوارات وأجهزة منزلية وخدمة صيانة سريعة.",
// Quick Fix Services
nameAr: "خدمات الإصلاح السريع",
descriptionAr: "سباكة وكهرباء وصيانة أجهزة منزلية بإتقان من أول مرة.",
// Modern Clothes Store
nameAr: "مودرن للملابس",
descriptionAr: "أزياء عصرية للرجال والنساء والأطفال مع تشكيلات جديدة كل أسبوع.",
// Al-Ahly Cafeteria
nameAr: "كافيتريا الأهلي",
descriptionAr: "قهوة وشيشة ومشروبات باردة ووجبات خفيفة في جو مريح.",
// Best Pets Shop
nameAr: "بيست باص",
descriptionAr: "أكل حيوانات واكسسوارات وتجميل وحجز رعاية بيطرية.",
```

- [ ] **Step 2: Add an Arabic description helper**

Next to the existing `sampleDescription` helper:

```js
const sampleDescriptionAr = (text) =>
  `${text} تجدنا على دليل أبو غالب المحلي.`;
```

- [ ] **Step 3: Replace the seed loop with backfill-on-empty logic**

Replace the whole `for (const s of shops)` block:

```js
for (const s of shops) {
  const slug = makeSlug(s.name);
  const existing = await Shop.findOne({ slug });
  if (existing) {
    const update = {};
    if (!existing.nameAr) update.nameAr = s.nameAr;
    if (!existing.descriptionAr) update.descriptionAr = sampleDescriptionAr(s.descriptionAr);
    if (Object.keys(update).length > 0) {
      await Shop.updateOne({ _id: existing._id }, { $set: update });
      backfilled += 1;
    } else {
      skipped += 1;
    }
    continue;
  }

  const category = catBySlug[s.categorySlug];
  if (!category) {
    console.warn(`Skipping "${s.name}": category "${s.categorySlug}" not found. Run seed:categories first.`);
    skipped += 1;
    continue;
  }

  const { categorySlug, imageSeed, ...payload } = s;
  await Shop.create({
    ...payload,
    nameAr: s.nameAr,
    slug,
    category: category._id,
    description: sampleDescription(s.description),
    descriptionAr: sampleDescriptionAr(s.descriptionAr),
    images: [
      { url: `https://picsum.photos/seed/${imageSeed}/800/600`, publicId: "" },
      { url: `https://picsum.photos/seed/${imageSeed}-2/800/600`, publicId: "" },
      { url: `https://picsum.photos/seed/${imageSeed}-3/800/600`, publicId: "" },
    ],
    status: "active",
  });
  created += 1;
}
```

Update the counters declaration and log:

```js
let created = 0;
let skipped = 0;
let backfilled = 0;
```

```js
console.log(`Shops seed done -> ${created} created, ${backfilled} backfilled, ${skipped} skipped.`);
```

---

### Task 7: Verify seed idempotency + backfill against the dev DB

- [ ] **Step 1: Run the full seed**

Run (from `D:\dalil\server`): `npm run seed`
Expected: categories log shows `12 created, 0 backfilled, 0 already complete` (fresh DB) — OR `0 created, 12 backfilled, 0 already complete` if the dev DB already had categories.

- [ ] **Step 2: Run it again to confirm idempotency**

Run: `npm run seed`
Expected: `0 created, 0 backfilled, 12 already complete` and `10 created`/`10 backfilled`/`10 already complete` similarly. No duplicates.

- [ ] **Step 3: Spot-check Arabic fields**

Run a quick query (via `mongosh dalil` or the test suite) confirming a category has both `name` and `nameAr`.

---

## Phase 2 — Client: i18n foundation

### Task 8: Install i18next deps

**Files:**
- Modify: `D:\dalil\client\package.json`

- [ ] **Step 1: Install**

Run (from `D:\dalil\client`):

```bash
npm install i18next react-i18next
```

Expected: deps appear in `package.json` under `dependencies`.

---

### Task 9: i18next config + locale JSON files

**Files:**
- Create: `D:\dalil\client\src\i18n\index.js`
- Create: `D:\dalil\client\src\i18n\locales\en.json`
- Create: `D:\dalil\client\src\i18n\locales\ar.json`

- [ ] **Step 1: Create `src/i18n/index.js`**

```js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

const LANG_KEY = "dalil-lang";
export const DEFAULT_LANG = "ar";

export function getStoredLang() {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    return stored === "en" ? "en" : stored === "ar" ? "ar" : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

export function setStoredLang(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // storage unavailable — ignore
  }
}

export function applyDocumentLanguage(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}

export function changeLanguage(lang) {
  applyDocumentLanguage(lang);
  setStoredLang(lang);
  return i18n.changeLanguage(lang);
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: getStoredLang(),
  fallbackLng: "ar",
  interpolation: { escapeValue: false },
});

export default i18n;
```

- [ ] **Step 2: Create `src/i18n/locales/en.json`**

```json
{
  "brand": {
    "name": "Dalil",
    "tagline": "Discover local shops and services in Abou Ghaleb",
    "description": "The digital directory for Abou Ghaleb — helping you discover, contact and reach local shops and services."
  },
  "lang": { "switch": "Switch language" },
  "meta": {
    "homeTitle": "Dalil — Local Shops & Services in Abou Ghaleb",
    "shopsTitle": "All Shops — Dalil, Abou Ghaleb",
    "shopsDescription": "Browse every local shop and service listed on Dalil.",
    "categoryTitle": "{{name}} — Dalil, Abou Ghaleb",
    "categoryFallbackTitle": "Category — Dalil",
    "shopTitle": "{{name}} — Dalil, Abou Ghaleb",
    "shopFallbackTitle": "Shop — Dalil",
    "adminDashboard": "Dashboard — Dalil Admin",
    "adminShops": "Shop Management — Dalil Admin",
    "adminManagers": "Manager Management — Dalil Admin",
    "adminCategories": "Categories — Dalil Admin",
    "adminAnalytics": "Analytics — Dalil Admin",
    "adminSettings": "Settings — Dalil Admin",
    "managerDashboard": "Dashboard — Dalil Manager",
    "managerShop": "My Shop — Dalil Manager",
    "managerGallery": "Images — Dalil Manager",
    "managerHours": "Working Hours — Dalil Manager",
    "managerAnalytics": "Analytics — Dalil Manager",
    "managerSettings": "Change Password — Dalil Manager"
  },
  "common": {
    "loading": "Loading",
    "close": "Close",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "saveChanges": "Save changes",
    "search": "Search",
    "reset": "Reset",
    "active": "Active",
    "inactive": "Inactive",
    "disabled": "Disabled",
    "today": "Today",
    "closed": "Closed",
    "open": "Open",
    "views": "views",
    "shops": "shops",
    "shop": "shop",
    "nothingFound": "Nothing found",
    "somethingWentWrong": "Something went wrong. Please try again.",
    "linkCopied": "Link copied to clipboard",
    "couldNotCopy": "Could not copy link"
  },
  "nav": {
    "home": "Home",
    "shops": "Shops",
    "categories": "Categories",
    "allShops": "All Shops",
    "openNow": "Open Now",
    "manager": "Manager",
    "admin": "Admin",
    "managerLogin": "Manager Login",
    "adminLogin": "Admin Login",
    "toggleMenu": "Toggle menu",
    "area": "{{area}}"
  },
  "footer": {
    "explore": "Explore",
    "forBusiness": "For Business",
    "contact": "Contact",
    "support": "Support: ask your local admin",
    "rights": "© {{year}} Dalil — {{area}} Local Directory. Built for the community."
  },
  "days": {
    "saturday": "Saturday",
    "sunday": "Sunday",
    "monday": "Monday",
    "tuesday": "Tuesday",
    "wednesday": "Wednesday",
    "thursday": "Thursday",
    "friday": "Friday",
    "to": "to",
    "openingTime": "{{day}} opening time",
    "closingTime": "{{day}} closing time"
  },
  "status": {
    "openNow": "Open Now",
    "open": "Open",
    "closedNow": "Closed Now",
    "closedOpensAt": "Closed · opens {{time}}"
  },
  "home": {
    "guide": "Your guide to {{area}}",
    "heroTitle": "Discover local shops & services near you",
    "heroSubtitle": "Find restaurants, pharmacies, salons and more in {{area}} — with contact info, working hours and directions.",
    "searchPlaceholder": "Search for a shop or service…",
    "searchLabel": "Search shops",
    "searchButton": "Search",
    "browseByCategory": "Browse by category",
    "seeOpenNow": "See what's open now",
    "categoriesEyebrow": "Categories",
    "categoriesTitle": "Browse by category",
    "categoriesSubtitle": "Every local business in {{area}}, organized for you.",
    "viewAllShops": "View all shops",
    "noCategoriesTitle": "No categories yet",
    "noCategoriesSubtitle": "Categories will appear here once added.",
    "shopCount": "{{count}} shops",
    "popularEyebrow": "Popular",
    "popularTitle": "Popular shops",
    "popularSubtitle": "The most visited places in {{area}} right now.",
    "noPopularTitle": "No shops yet",
    "noPopularSubtitle": "Popular shops will appear here as they get visited.",
    "latestEyebrow": "Fresh on the list",
    "latestTitle": "Latest shops",
    "latestSubtitle": "Newest additions to the {{area}} directory.",
    "noLatestTitle": "Nothing yet",
    "noLatestSubtitle": "New shops will show up here.",
    "ownShopTitle": "Own a shop in {{area}}?",
    "ownShopText": "Get discovered by people nearby. Ask your local administrator to add your business to the Dalil directory.",
    "exploreDirectory": "Explore the directory",
    "administratorAccess": "Administrator access"
  },
  "shops": {
    "title": "All Shops",
    "count": "{{count}} shops in Abou Ghaleb",
    "fallback": "Search the full directory of local businesses.",
    "errorTitle": "Something went wrong",
    "noMatchTitle": "No shops match your search",
    "noMatchSubtitle": "Try different keywords or clear the filters to see everything.",
    "resetFilters": "Reset Filters",
    "failedToLoad": "Failed to load shops."
  },
  "shopFilters": {
    "searchPlaceholder": "Search for a shop or service…",
    "filters": "Filters",
    "allCategories": "All categories",
    "openNow": "Open Now"
  },
  "shopCard": {
    "categoryFallback": "Shop",
    "descriptionFallback": "Local shop in Abou Ghaleb.",
    "featured": "Featured",
    "viewDetails": "View details",
    "copyLink": "Copy shop link"
  },
  "shopDetails": {
    "loading": "Loading shop…",
    "notFoundTitle": "Shop not found",
    "notFoundSubtitle": "This shop may not exist, or it may have been removed.",
    "browseAll": "Browse all shops",
    "home": "Home",
    "shops": "Shops",
    "views": "{{count}} views",
    "noDescription": "No description yet.",
    "getInTouch": "Get in touch",
    "location": "Location",
    "noAddress": "No address provided.",
    "workingHours": "Working hours",
    "backToAll": "Back to all shops"
  },
  "shopGallery": {
    "noImages": "No images",
    "photoAlt": "{{name}} — photo {{number}}",
    "previousPhoto": "Previous photo",
    "nextPhoto": "Next photo",
    "showPhoto": "Show photo {{number}}"
  },
  "contact": {
    "call": "Call {{phone}}",
    "whatsappMessage": "Hello {{name}}, I found you on Dalil!",
    "chatWhatsApp": "Chat on WhatsApp",
    "getDirections": "Get Directions",
    "openWebsite": "Open Website",
    "facebook": "Facebook",
    "instagram": "Instagram",
    "tiktok": "TikTok",
    "copyLink": "Copy Link",
    "linkCopied": "Link Copied"
  },
  "categoryShops": {
    "notFoundTitle": "Category not found",
    "notFoundSubtitle": "This category doesn't exist or has been deactivated.",
    "browseAll": "Browse all shops",
    "noShopsTitle": "No shops in this category yet",
    "noShopsSubtitle": "Check back soon — new shops are being added all the time.",
    "backToAll": "← Back to all shops",
    "defaultDescription": "{{name}} shops in Abou Ghaleb."
  },
  "notFound": {
    "title": "Page not found",
    "text": "The page you are looking for doesn't exist or has been moved.",
    "backHome": "Back to Home"
  },
  "login": {
    "adminTitle": "Admin Login",
    "adminSubtitle": "Sign in to manage shops, managers and categories.",
    "managerTitle": "Manager Login",
    "managerSubtitle": "Sign in to manage your assigned shop.",
    "email": "Email",
    "emailPlaceholder": "you@example.com",
    "password": "Password",
    "signIn": "Sign in",
    "showPassword": "Show password",
    "hidePassword": "Hide password",
    "welcomeBack": "Welcome back!",
    "failed": "Login failed. Please check your credentials.",
    "backToDirectory": "← Back to the directory"
  },
  "changePassword": {
    "title": "Change password",
    "current": "Current password",
    "new": "New password",
    "confirm": "Confirm new password",
    "update": "Update password",
    "lengthWarning": "New password must be at least 6 characters.",
    "mismatchWarning": "New passwords do not match.",
    "success": "Password changed successfully.",
    "failed": "Could not change password."
  },
  "sidebar": {
    "logout": "Logout",
    "closeSidebar": "Close sidebar",
    "openSidebar": "Open sidebar"
  },
  "pagination": {
    "previousPage": "Previous page",
    "nextPage": "Next page"
  },
  "statCard": {
    "vsLastPeriod": "vs last period"
  },
  "adminLayout": {
    "brand": "Dalil Admin",
    "dashboard": "Dashboard",
    "shops": "Shops",
    "managers": "Managers",
    "categories": "Categories",
    "analytics": "Analytics",
    "settings": "Settings",
    "shopManagement": "Shop Management",
    "managerManagement": "Manager Management",
    "titleFallback": "Admin"
  },
  "managerLayout": {
    "brand": "Dalil Manager",
    "dashboard": "Dashboard",
    "myShop": "My Shop",
    "gallery": "Images",
    "galleryTitle": "Images & Gallery",
    "hours": "Working Hours",
    "changePassword": "Change Password",
    "titleFallback": "Manager"
  },
  "adminDashboard": {
    "totalShops": "Total Shops",
    "activeShops": "Active Shops",
    "inactiveShops": "Inactive Shops",
    "managers": "Managers",
    "totalViews": "Total Views",
    "viewsToday": "Views Today",
    "viewsWeek": "Views This Week",
    "viewsMonth": "Views This Month",
    "viewsLast7": "Views — last 7 days",
    "noViewData": "No view data yet. Visit some shops to get started.",
    "topShops": "Top shops",
    "noDataYet": "No data yet.",
    "fullAnalytics": "Full analytics"
  },
  "adminShops": {
    "searchPlaceholder": "Search shops…",
    "allStatuses": "All statuses",
    "newShop": "New Shop",
    "noShopsTitle": "No shops found",
    "noShopsSubtitle": "Create your first shop to get started.",
    "nameRequired": "Shop name is required.",
    "categoryRequired": "Please choose a category.",
    "updated": "Shop updated successfully.",
    "created": "Shop created successfully.",
    "deactivated": "Shop deactivated.",
    "activated": "Shop activated.",
    "deleted": "Shop deleted.",
    "failedToLoad": "Failed to load shops.",
    "failedToSave": "Failed to save shop.",
    "failedStatus": "Failed to update status.",
    "failedDelete": "Failed to delete shop.",
    "editShop": "Edit Shop",
    "createShop": "Create Shop",
    "shopName": "Shop name *",
    "shopNamePlaceholder": "e.g. Al-Tayeb Restaurant",
    "shopNameAr": "Shop name (Arabic)",
    "shopNameArPlaceholder": "الاسم بالعربية…",
    "category": "Category *",
    "selectCategory": "Select category…",
    "status": "Status",
    "managerOptional": "Manager (optional)",
    "none": "None",
    "phone": "Phone",
    "phonePlaceholder": "+20 10 1234 5678",
    "whatsapp": "WhatsApp",
    "whatsappPlaceholder": "Same as phone by default",
    "description": "Description",
    "descriptionPlaceholder": "What does this shop offer?",
    "descriptionAr": "Description (Arabic)",
    "descriptionArPlaceholder": "ماذا يقدم هذا المحل؟ (بالعربية)",
    "address": "Address",
    "addressPlaceholder": "Main Street, Abou Ghaleb",
    "latitude": "Latitude",
    "longitude": "Longitude",
    "googleMapsLink": "Google Maps link",
    "googleMapsPlaceholder": "https://maps.google.com/…",
    "socialLinks": "Social links",
    "facebookUrl": "Facebook URL",
    "instagramUrl": "Instagram URL",
    "tiktokUrl": "TikTok URL",
    "websiteUrl": "Website URL",
    "workingHours": "Working hours",
    "hide": "Hide",
    "colShop": "Shop",
    "colCategory": "Category",
    "colManager": "Manager",
    "colViews": "Views",
    "colCreated": "Created",
    "colStatus": "Status",
    "colActions": "Actions",
    "deactivate": "Deactivate shop",
    "activate": "Activate shop",
    "deleteTitle": "Delete shop?",
    "deleteMessage": "Deleting \"{{name}}\" removes it permanently, including its analytics history. This cannot be undone.",
    "deleteConfirm": "Delete shop"
  },
  "adminCategories": {
    "searchPlaceholder": "Search categories…",
    "newCategory": "New Category",
    "noCategoriesTitle": "No categories",
    "noCategoriesSubtitle": "Create categories so shops can be organized.",
    "nameRequired": "Category name is required.",
    "updated": "Category updated.",
    "created": "Category created.",
    "deactivated": "Category deactivated.",
    "activated": "Category activated.",
    "deleted": "Category deleted.",
    "failedToLoad": "Failed to load categories.",
    "failedToSave": "Failed to save category.",
    "failedStatus": "Failed to update category.",
    "failedDelete": "Failed to delete category.",
    "editCategory": "Edit Category",
    "createCategory": "Create Category",
    "name": "Name *",
    "nameAr": "Name (Arabic)",
    "nameArPlaceholder": "الاسم بالعربية…",
    "description": "Description",
    "descriptionAr": "Description (Arabic)",
    "descriptionArPlaceholder": "الوصف بالعربية…",
    "icon": "Icon",
    "categoryActive": "Category active",
    "colCategory": "Category",
    "colSlug": "Slug",
    "colDescription": "Description",
    "colStatus": "Status",
    "colActions": "Actions",
    "deleteTitle": "Delete category?",
    "deleteMessage": "Deleting \"{{name}}\" is only possible if no shops are using it. This cannot be undone.",
    "deleteConfirm": "Delete category"
  },
  "adminManagers": {
    "searchPlaceholder": "Search managers…",
    "newManager": "New Manager",
    "noManagersTitle": "No managers found",
    "noManagersSubtitle": "Managers are created only by the administrator and linked to a shop.",
    "nameRequired": "Name is required.",
    "shopRequired": "Every manager must be linked to a shop.",
    "passwordRequired": "Temporary password is required.",
    "updated": "Manager updated.",
    "created": "Manager created.",
    "disabled": "Manager \"{{name}}\" disabled.",
    "enabled": "Manager \"{{name}}\" enabled.",
    "passwordReset": "Password reset for {{name}}.",
    "deleted": "Manager deleted.",
    "failedToLoad": "Failed to load managers.",
    "failedToSave": "Failed to save manager.",
    "failedStatus": "Failed to update manager.",
    "failedReset": "Failed to reset password.",
    "failedDelete": "Failed to delete manager.",
    "editManager": "Edit Manager",
    "createManager": "Create Manager",
    "fullName": "Full name *",
    "email": "Email *",
    "tempPassword": "Temporary password *",
    "tempPasswordPlaceholder": "Give the manager this password once",
    "tempPasswordHint": "The manager should change it after the first login.",
    "linkedShop": "Linked shop *",
    "selectShop": "Select shop…",
    "inactiveTag": "(inactive)",
    "accountActive": "Account active",
    "resetTitle": "Reset manager password",
    "resetText": "Set a new temporary password for <strong>{{name}}</strong>. The manager will need to use it the next time they sign in.",
    "newTempPassword": "New temporary password",
    "newPasswordPlaceholder": "At least 6 characters",
    "resetPassword": "Reset password",
    "colName": "Name",
    "colEmail": "Email",
    "colShop": "Shop",
    "colStatus": "Status",
    "colCreatedAt": "Created At",
    "colActions": "Actions",
    "deleteTitle": "Delete manager?",
    "deleteMessage": "Deleting \"{{name}}\" will unlink them from their shop and remove their login access permanently.",
    "deleteConfirm": "Delete manager"
  },
  "adminAnalytics": {
    "totalShops": "Total Shops",
    "managers": "Managers",
    "totalViews": "Total Views",
    "categories": "Categories",
    "viewsToday": "Views Today",
    "viewsWeek": "Views This Week",
    "viewsMonth": "Views This Month",
    "viewsLast7": "Views — last 7 days",
    "noViewData": "No view data yet. Share shop pages to start collecting analytics.",
    "mostPopular": "Most popular",
    "noDataYet": "No data yet.",
    "views": "views"
  },
  "adminSettings": {
    "account": "Account",
    "name": "Name",
    "email": "Email",
    "role": "Role",
    "administrator": "Administrator"
  },
  "managerDashboard": {
    "assignedShop": "Your assigned shop · {{views}} total views",
    "totalViews": "Total Views",
    "viewsToday": "Views Today",
    "viewsWeek": "This Week",
    "viewsMonth": "This Month",
    "viewsLast7": "Views — last 7 days",
    "noViews": "No views yet. Share your shop page with customers!",
    "engagement": "Engagement",
    "phoneClicks": "Phone Clicks",
    "whatsappClicks": "WhatsApp Clicks",
    "mapsClicks": "Maps Clicks",
    "websiteClicks": "Website Clicks"
  },
  "managerShopEdit": {
    "failedToLoad": "Failed to load your shop.",
    "info": "You can update your contact details, description and links. Name, category and status are managed by the administrator.",
    "contactDescription": "Contact & description",
    "description": "Description",
    "descriptionAr": "Description (Arabic)",
    "descriptionArPlaceholder": "ماذا يقدم هذا المحل؟ (بالعربية)",
    "phone": "Phone",
    "phonePlaceholder": "+20 10 1234 5678",
    "whatsapp": "WhatsApp number",
    "location": "Location",
    "address": "Address",
    "latitude": "Latitude",
    "longitude": "Longitude",
    "googleMapsLink": "Google Maps link",
    "googleMapsPlaceholder": "https://maps.google.com/…",
    "socialLinks": "Social links",
    "facebook": "Facebook",
    "instagram": "Instagram",
    "tiktok": "TikTok",
    "website": "Website",
    "saveChanges": "Save changes",
    "updated": "Shop updated successfully.",
    "failedToUpdate": "Failed to update shop."
  },
  "managerGallery": {
    "failedToLoad": "Failed to load shop.",
    "uploadPhotos": "Upload photos",
    "uploading": "Uploading…",
    "upload": "Upload",
    "chooseFirst": "Choose at least one image first.",
    "uploaded": "{{count}} image(s) uploaded.",
    "failedUpload": "Upload failed.",
    "fileHint": "{{count}} file(s) selected · JPG, PNG or WEBP · max 5MB each",
    "noPhotosTitle": "No photos yet",
    "noPhotosSubtitle": "Upload photos so visitors can see your shop.",
    "deleteTitle": "Delete image?",
    "deleteMessage": "This photo will be removed from your shop permanently.",
    "deleteConfirm": "Delete image",
    "deleteImageTitle": "Delete image",
    "imageDeleted": "Image deleted.",
    "failedDelete": "Failed to delete image."
  },
  "managerHours": {
    "failedToLoad": "Failed to load working hours.",
    "hint": "Set when your shop is open each day. The “open now” badge on your listing updates automatically — including for hours that cross midnight.",
    "saveWorkingHours": "Save working hours",
    "updated": "Working hours updated.",
    "failedToSave": "Failed to save working hours."
  },
  "managerAnalytics": {
    "forYourShopOnly": "Analytics for your shop only",
    "totalViews": "Total Views",
    "viewsToday": "Views Today",
    "viewsWeek": "This Week",
    "viewsMonth": "This Month",
    "viewsLast7": "Views — last 7 days",
    "noViewData": "No view data yet.",
    "clickThroughs": "Click-throughs",
    "totalClicks": "{{count}} total action clicks",
    "phone": "Phone",
    "whatsapp": "WhatsApp",
    "googleMaps": "Google Maps",
    "website": "Website",
    "facebook": "Facebook",
    "instagram": "Instagram",
    "tiktok": "TikTok"
  },
  "managerSettings": {
    "account": "Account",
    "name": "Name",
    "email": "Email",
    "role": "Role",
    "shopManager": "Shop Manager"
  }
}
```

- [ ] **Step 3: Create `src/i18n/locales/ar.json`**

Same structure as `en.json`, with Arabic values. Use these translations for the non-obvious ones (all others follow naturally):

```json
{
  "brand": {
    "name": "دليل",
    "tagline": "اكتشف المحلات والخدمات المحلية في أبو غالب",
    "description": "الدليل الرقمي لأبو غالب — يساعدك على اكتشاف المحلات والخدمات المحلية والتواصل معها والوصول إليها."
  },
  "lang": { "switch": "تغيير اللغة" },
  "meta": {
    "homeTitle": "دليل — المحلات والخدمات المحلية في أبو غالب",
    "shopsTitle": "كل المحلات — دليل، أبو غالب",
    "shopsDescription": "تصفح كل المحلات والخدمات المحلية المسجلة على دليل.",
    "categoryTitle": "{{name}} — دليل، أبو غالب",
    "categoryFallbackTitle": "تصنيف — دليل",
    "shopTitle": "{{name}} — دليل، أبو غالب",
    "shopFallbackTitle": "محل — دليل",
    "adminDashboard": "لوحة التحكم — دليل الإدارة",
    "adminShops": "إدارة المحلات — دليل الإدارة",
    "adminManagers": "إدارة المديرين — دليل الإدارة",
    "adminCategories": "التصنيفات — دليل الإدارة",
    "adminAnalytics": "الإحصائيات — دليل الإدارة",
    "adminSettings": "الإعدادات — دليل الإدارة",
    "managerDashboard": "لوحة التحكم — دليل المدير",
    "managerShop": "المحل الخاص بي — دليل المدير",
    "managerGallery": "الصور — دليل المدير",
    "managerHours": "ساعات العمل — دليل المدير",
    "managerAnalytics": "الإحصائيات — دليل المدير",
    "managerSettings": "تغيير كلمة المرور — دليل المدير"
  },
  "common": {
    "loading": "جارٍ التحميل",
    "close": "إغلاق",
    "cancel": "إلغاء",
    "delete": "حذف",
    "edit": "تعديل",
    "saveChanges": "حفظ التغييرات",
    "search": "بحث",
    "reset": "إعادة ضبط",
    "active": "نشط",
    "inactive": "غير نشط",
    "disabled": "معطل",
    "today": "اليوم",
    "closed": "مغلق",
    "open": "مفتوح",
    "views": "مشاهدة",
    "shops": "محل",
    "shop": "محل",
    "nothingFound": "لا توجد نتائج",
    "somethingWentWrong": "حدث خطأ ما. حاول مرة أخرى.",
    "linkCopied": "تم نسخ الرابط",
    "couldNotCopy": "تعذر نسخ الرابط"
  },
  "nav": {
    "home": "الرئيسية",
    "shops": "المحلات",
    "categories": "التصنيفات",
    "allShops": "كل المحلات",
    "openNow": "مفتوح الآن",
    "manager": "المدير",
    "admin": "الإدارة",
    "managerLogin": "دخول المدير",
    "adminLogin": "دخول الإدارة",
    "toggleMenu": "فتح القائمة",
    "area": "{{area}}"
  },
  "footer": {
    "explore": "استكشف",
    "forBusiness": "لأصحاب الأعمال",
    "contact": "اتصل بنا",
    "support": "الدعم: اسأل المسؤول المحلي",
    "rights": "© {{year}} دليل — الدليل المحلي لأبو غالب. صُنع للمجتمع."
  },
  "days": {
    "saturday": "السبت",
    "sunday": "الأحد",
    "monday": "الاثنين",
    "tuesday": "الثلاثاء",
    "wednesday": "الأربعاء",
    "thursday": "الخميس",
    "friday": "الجمعة",
    "to": "إلى",
    "openingTime": "وقت فتح {{day}}",
    "closingTime": "وقت إغلاق {{day}}"
  },
  "status": {
    "openNow": "مفتوح الآن",
    "open": "مفتوح",
    "closedNow": "مغلق الآن",
    "closedOpensAt": "مغلق · يفتح {{time}}"
  },
  "home": {
    "guide": "دليلك إلى {{area}}",
    "heroTitle": "اكتشف المحلات والخدمات القريبة منك",
    "heroSubtitle": "اعثر على مطاعم وصيدليات وصالونات والمزيد في {{area}} — مع بيانات الاتصال وساعات العمل وطرق الوصول.",
    "searchPlaceholder": "ابحث عن محل أو خدمة…",
    "searchLabel": "البحث في المحلات",
    "searchButton": "بحث",
    "browseByCategory": "تصفح حسب التصنيف",
    "seeOpenNow": "شاهد ما هو مفتوح الآن",
    "categoriesEyebrow": "التصنيفات",
    "categoriesTitle": "تصفح حسب التصنيف",
    "categoriesSubtitle": "كل الأعمال المحلية في {{area}}، منظمة لك.",
    "viewAllShops": "عرض كل المحلات",
    "noCategoriesTitle": "لا توجد تصنيفات بعد",
    "noCategoriesSubtitle": "ستظهر التصنيفات هنا بمجرد إضافتها.",
    "shopCount": "{{count}} محل",
    "popularEyebrow": "الأكثر زيارة",
    "popularTitle": "المحلات الشائعة",
    "popularSubtitle": "الأماكن الأكثر زيارة في {{area}} الآن.",
    "noPopularTitle": "لا توجد محلات بعد",
    "noPopularSubtitle": "ستظهر المحلات الشائعة هنا مع زيادة الزيارات.",
    "latestEyebrow": "جديد في الدليل",
    "latestTitle": "أحدث المحلات",
    "latestSubtitle": "أحدث الإضافات إلى دليل {{area}}.",
    "noLatestTitle": "لا شيء بعد",
    "noLatestSubtitle": "ستظهر المحلات الجديدة هنا.",
    "ownShopTitle": "هل تملك محلًا في {{area}}؟",
    "ownShopText": "اجعل الناس يكتشفونك. اطلب من المسؤول المحلي إضافة عملك إلى دليل «دليل».",
    "exploreDirectory": "استكشف الدليل",
    "administratorAccess": "دخول الإدارة"
  },
  "shops": {
    "title": "كل المحلات",
    "count": "{{count}} محل في أبو غالب",
    "fallback": "ابحث في كامل دليل الأعمال المحلية.",
    "errorTitle": "حدث خطأ ما",
    "noMatchTitle": "لا توجد محلات تطابق بحثك",
    "noMatchSubtitle": "جرّب كلمات مختلفة أو امسح عوامل التصفية لرؤية كل شيء.",
    "resetFilters": "إعادة ضبط التصفية",
    "failedToLoad": "تعذر تحميل المحلات."
  },
  "shopFilters": {
    "searchPlaceholder": "ابحث عن محل أو خدمة…",
    "filters": "تصفية",
    "allCategories": "كل التصنيفات",
    "openNow": "مفتوح الآن"
  },
  "shopCard": {
    "categoryFallback": "محل",
    "descriptionFallback": "محل محلي في أبو غالب.",
    "featured": "مميز",
    "viewDetails": "عرض التفاصيل",
    "copyLink": "نسخ رابط المحل"
  },
  "shopDetails": {
    "loading": "جارٍ تحميل المحل…",
    "notFoundTitle": "المحل غير موجود",
    "notFoundSubtitle": "ربما لا يوجد هذا المحل أو تمت إزالته.",
    "browseAll": "تصفح كل المحلات",
    "home": "الرئيسية",
    "shops": "المحلات",
    "views": "{{count}} مشاهدة",
    "noDescription": "لا يوجد وصف بعد.",
    "getInTouch": "تواصل معنا",
    "location": "الموقع",
    "noAddress": "لم يتم توفير عنوان.",
    "workingHours": "ساعات العمل",
    "backToAll": "العودة إلى كل المحلات"
  },
  "shopGallery": {
    "noImages": "لا توجد صور",
    "photoAlt": "{{name}} — صورة {{number}}",
    "previousPhoto": "الصورة السابقة",
    "nextPhoto": "الصورة التالية",
    "showPhoto": "عرض الصورة {{number}}"
  },
  "contact": {
    "call": "اتصال {{phone}}",
    "whatsappMessage": "مرحبًا {{name}}، وجدتك على دليل!",
    "chatWhatsApp": "محادثة واتساب",
    "getDirections": "الاتجاهات",
    "openWebsite": "فتح الموقع",
    "facebook": "فيسبوك",
    "instagram": "انستغرام",
    "tiktok": "تيك توك",
    "copyLink": "نسخ الرابط",
    "linkCopied": "تم نسخ الرابط"
  },
  "categoryShops": {
    "notFoundTitle": "التصنيف غير موجود",
    "notFoundSubtitle": "هذا التصنيف غير موجود أو تم إيقافه.",
    "browseAll": "تصفح كل المحلات",
    "noShopsTitle": "لا توجد محلات في هذا التصنيف بعد",
    "noShopsSubtitle": "عد قريبًا — تُضاف محلات جديدة طوال الوقت.",
    "backToAll": "← العودة إلى كل المحلات",
    "defaultDescription": "محلات {{name}} في أبو غالب."
  },
  "notFound": {
    "title": "الصفحة غير موجودة",
    "text": "الصفحة التي تبحث عنها غير موجودة أو تم نقلها.",
    "backHome": "العودة إلى الرئيسية"
  },
  "login": {
    "adminTitle": "دخول الإدارة",
    "adminSubtitle": "سجّل الدخول لإدارة المحلات والمديرين والتصنيفات.",
    "managerTitle": "دخول المدير",
    "managerSubtitle": "سجّل الدخول لإدارة المحل المخصص لك.",
    "email": "البريد الإلكتروني",
    "emailPlaceholder": "you@example.com",
    "password": "كلمة المرور",
    "signIn": "تسجيل الدخول",
    "showPassword": "إظهار كلمة المرور",
    "hidePassword": "إخفاء كلمة المرور",
    "welcomeBack": "مرحبًا بعودتك!",
    "failed": "فشل تسجيل الدخول. تحقق من بياناتك.",
    "backToDirectory": "← العودة إلى الدليل"
  },
  "changePassword": {
    "title": "تغيير كلمة المرور",
    "current": "كلمة المرور الحالية",
    "new": "كلمة المرور الجديدة",
    "confirm": "تأكيد كلمة المرور الجديدة",
    "update": "تحديث كلمة المرور",
    "lengthWarning": "يجب ألا تقل كلمة المرور الجديدة عن 6 أحرف.",
    "mismatchWarning": "كلمتا المرور غير متطابقتين.",
    "success": "تم تغيير كلمة المرور بنجاح.",
    "failed": "تعذر تغيير كلمة المرور."
  },
  "sidebar": {
    "logout": "تسجيل الخروج",
    "closeSidebar": "إغلاق القائمة",
    "openSidebar": "فتح القائمة"
  },
  "pagination": {
    "previousPage": "الصفحة السابقة",
    "nextPage": "الصفحة التالية"
  },
  "statCard": {
    "vsLastPeriod": "مقارنة بالفترة السابقة"
  },
  "adminLayout": {
    "brand": "دليل الإدارة",
    "dashboard": "لوحة التحكم",
    "shops": "المحلات",
    "managers": "المديرون",
    "categories": "التصنيفات",
    "analytics": "الإحصائيات",
    "settings": "الإعدادات",
    "shopManagement": "إدارة المحلات",
    "managerManagement": "إدارة المديرين",
    "titleFallback": "الإدارة"
  },
  "managerLayout": {
    "brand": "دليل المدير",
    "dashboard": "لوحة التحكم",
    "myShop": "المحل الخاص بي",
    "gallery": "الصور",
    "galleryTitle": "الصور والمعرض",
    "hours": "ساعات العمل",
    "changePassword": "تغيير كلمة المرور",
    "titleFallback": "المدير"
  },
  "adminDashboard": {
    "totalShops": "إجمالي المحلات",
    "activeShops": "محلات نشطة",
    "inactiveShops": "محلات غير نشطة",
    "managers": "المديرون",
    "totalViews": "إجمالي المشاهدات",
    "viewsToday": "مشاهدات اليوم",
    "viewsWeek": "مشاهدات هذا الأسبوع",
    "viewsMonth": "مشاهدات هذا الشهر",
    "viewsLast7": "المشاهدات — آخر 7 أيام",
    "noViewData": "لا توجد بيانات مشاهدات بعد. زُر بعض المحلات للبدء.",
    "topShops": "أفضل المحلات",
    "noDataYet": "لا توجد بيانات بعد.",
    "fullAnalytics": "الإحصائيات الكاملة"
  },
  "adminShops": {
    "searchPlaceholder": "ابحث في المحلات…",
    "allStatuses": "كل الحالات",
    "newShop": "محل جديد",
    "noShopsTitle": "لا توجد محلات",
    "noShopsSubtitle": "أنشئ أول محل لك للبدء.",
    "nameRequired": "اسم المحل مطلوب.",
    "categoryRequired": "يرجى اختيار تصنيف.",
    "updated": "تم تحديث المحل بنجاح.",
    "created": "تم إنشاء المحل بنجاح.",
    "deactivated": "تم إيقاف المحل.",
    "activated": "تم تفعيل المحل.",
    "deleted": "تم حذف المحل.",
    "failedToLoad": "تعذر تحميل المحلات.",
    "failedToSave": "تعذر حفظ المحل.",
    "failedStatus": "تعذر تحديث الحالة.",
    "failedDelete": "تعذر حذف المحل.",
    "editShop": "تعديل المحل",
    "createShop": "إنشاء محل",
    "shopName": "اسم المحل *",
    "shopNamePlaceholder": "مثال: مطعم الطيب",
    "shopNameAr": "اسم المحل (بالعربية)",
    "shopNameArPlaceholder": "الاسم بالعربية…",
    "category": "التصنيف *",
    "selectCategory": "اختر تصنيفًا…",
    "status": "الحالة",
    "managerOptional": "المدير (اختياري)",
    "none": "بدون",
    "phone": "الهاتف",
    "phonePlaceholder": "+20 10 1234 5678",
    "whatsapp": "واتساب",
    "whatsappPlaceholder": "نفس رقم الهاتف افتراضيًا",
    "description": "الوصف",
    "descriptionPlaceholder": "ماذا يقدم هذا المحل؟",
    "descriptionAr": "الوصف (بالعربية)",
    "descriptionArPlaceholder": "ماذا يقدم هذا المحل؟ (بالعربية)",
    "address": "العنوان",
    "addressPlaceholder": "الشارع الرئيسي، أبو غالب",
    "latitude": "خط العرض",
    "longitude": "خط الطول",
    "googleMapsLink": "رابط خرائط جوجل",
    "googleMapsPlaceholder": "https://maps.google.com/…",
    "socialLinks": "روابط التواصل",
    "facebookUrl": "رابط فيسبوك",
    "instagramUrl": "رابط انستغرام",
    "tiktokUrl": "رابط تيك توك",
    "websiteUrl": "رابط الموقع",
    "workingHours": "ساعات العمل",
    "hide": "إخفاء",
    "colShop": "المحل",
    "colCategory": "التصنيف",
    "colManager": "المدير",
    "colViews": "المشاهدات",
    "colCreated": "تاريخ الإنشاء",
    "colStatus": "الحالة",
    "colActions": "إجراءات",
    "deactivate": "إيقاف المحل",
    "activate": "تفعيل المحل",
    "deleteTitle": "حذف المحل؟",
    "deleteMessage": "حذف «{{name}}» يزيله نهائيًا بما في ذلك سجل الإحصائيات. لا يمكن التراجع عن ذلك.",
    "deleteConfirm": "حذف المحل"
  },
  "adminCategories": {
    "searchPlaceholder": "ابحث في التصنيفات…",
    "newCategory": "تصنيف جديد",
    "noCategoriesTitle": "لا توجد تصنيفات",
    "noCategoriesSubtitle": "أنشئ تصنيفات حتى يمكن تنظيم المحلات.",
    "nameRequired": "اسم التصنيف مطلوب.",
    "updated": "تم تحديث التصنيف.",
    "created": "تم إنشاء التصنيف.",
    "deactivated": "تم إيقاف التصنيف.",
    "activated": "تم تفعيل التصنيف.",
    "deleted": "تم حذف التصنيف.",
    "failedToLoad": "تعذر تحميل التصنيفات.",
    "failedToSave": "تعذر حفظ التصنيف.",
    "failedStatus": "تعذر تحديث التصنيف.",
    "failedDelete": "تعذر حذف التصنيف.",
    "editCategory": "تعديل التصنيف",
    "createCategory": "إنشاء تصنيف",
    "name": "الاسم *",
    "nameAr": "الاسم (بالعربية)",
    "nameArPlaceholder": "الاسم بالعربية…",
    "description": "الوصف",
    "descriptionAr": "الوصف (بالعربية)",
    "descriptionArPlaceholder": "الوصف بالعربية…",
    "icon": "الأيقونة",
    "categoryActive": "التصنيف نشط",
    "colCategory": "التصنيف",
    "colSlug": "الرابط",
    "colDescription": "الوصف",
    "colStatus": "الحالة",
    "colActions": "إجراءات",
    "deleteTitle": "حذف التصنيف؟",
    "deleteMessage": "حذف «{{name}}» ممكن فقط إذا لم تكن هناك محلات تستخدمه. لا يمكن التراجع عن ذلك.",
    "deleteConfirm": "حذف التصنيف"
  },
  "adminManagers": {
    "searchPlaceholder": "ابحث في المديرين…",
    "newManager": "مدير جديد",
    "noManagersTitle": "لا يوجد مديرون",
    "noManagersSubtitle": "المديرون ينشئهم المسؤول فقط ويتم ربطهم بمحل.",
    "nameRequired": "الاسم مطلوب.",
    "shopRequired": "كل مدير يجب أن يكون مرتبطًا بمحل.",
    "passwordRequired": "كلمة المرور المؤقتة مطلوبة.",
    "updated": "تم تحديث المدير.",
    "created": "تم إنشاء المدير.",
    "disabled": "تم تعطيل المدير «{{name}}».",
    "enabled": "تم تفعيل المدير «{{name}}».",
    "passwordReset": "تمت إعادة تعيين كلمة المرور لـ {{name}}.",
    "deleted": "تم حذف المدير.",
    "failedToLoad": "تعذر تحميل المديرين.",
    "failedToSave": "تعذر حفظ المدير.",
    "failedStatus": "تعذر تحديث المدير.",
    "failedReset": "تعذر إعادة تعيين كلمة المرور.",
    "failedDelete": "تعذر حذف المدير.",
    "editManager": "تعديل المدير",
    "createManager": "إنشاء مدير",
    "fullName": "الاسم الكامل *",
    "email": "البريد الإلكتروني *",
    "tempPassword": "كلمة مرور مؤقتة *",
    "tempPasswordPlaceholder": "أعطِ المدير كلمة المرور هذه مرة واحدة",
    "tempPasswordHint": "يجب على المدير تغييرها بعد أول تسجيل دخول.",
    "linkedShop": "المحل المرتبط *",
    "selectShop": "اختر محلًا…",
    "inactiveTag": "(غير نشط)",
    "accountActive": "الحساب نشط",
    "resetTitle": "إعادة تعيين كلمة مرور المدير",
    "resetText": "عيّن كلمة مرور مؤقتة جديدة لـ <strong>{{name}}</strong>. سيحتاج المدير إلى استخدامها في تسجيل الدخول التالي.",
    "newTempPassword": "كلمة المرور المؤقتة الجديدة",
    "newPasswordPlaceholder": "6 أحرف على الأقل",
    "resetPassword": "إعادة تعيين كلمة المرور",
    "colName": "الاسم",
    "colEmail": "البريد الإلكتروني",
    "colShop": "المحل",
    "colStatus": "الحالة",
    "colCreatedAt": "تاريخ الإنشاء",
    "colActions": "إجراءات",
    "deleteTitle": "حذف المدير؟",
    "deleteMessage": "حذف «{{name}}» سيفصلهم عن محلهم ويزيل إمكانية الدخول نهائيًا.",
    "deleteConfirm": "حذف المدير"
  },
  "adminAnalytics": {
    "totalShops": "إجمالي المحلات",
    "managers": "المديرون",
    "totalViews": "إجمالي المشاهدات",
    "categories": "التصنيفات",
    "viewsToday": "مشاهدات اليوم",
    "viewsWeek": "مشاهدات هذا الأسبوع",
    "viewsMonth": "مشاهدات هذا الشهر",
    "viewsLast7": "المشاهدات — آخر 7 أيام",
    "noViewData": "لا توجد بيانات مشاهدات بعد. شارك صفحات المحلات لبدء جمع الإحصائيات.",
    "mostPopular": "الأكثر شهرة",
    "noDataYet": "لا توجد بيانات بعد.",
    "views": "مشاهدة"
  },
  "adminSettings": {
    "account": "الحساب",
    "name": "الاسم",
    "email": "البريد الإلكتروني",
    "role": "الدور",
    "administrator": "مسؤول"
  },
  "managerDashboard": {
    "assignedShop": "المحل المخصص لك · {{views}} إجمالي المشاهدات",
    "totalViews": "إجمالي المشاهدات",
    "viewsToday": "مشاهدات اليوم",
    "viewsWeek": "هذا الأسبوع",
    "viewsMonth": "هذا الشهر",
    "viewsLast7": "المشاهدات — آخر 7 أيام",
    "noViews": "لا توجد مشاهدات بعد. شارك صفحة المحل مع عملائك!",
    "engagement": "التفاعل",
    "phoneClicks": "نقرات الهاتف",
    "whatsappClicks": "نقرات واتساب",
    "mapsClicks": "نقرات الخرائط",
    "websiteClicks": "نقرات الموقع"
  },
  "managerShopEdit": {
    "failedToLoad": "تعذر تحميل المحل الخاص بك.",
    "info": "يمكنك تحديث بيانات الاتصال والوصف والروابط. الاسم والتصنيف والحالة يديرها المسؤول.",
    "contactDescription": "بيانات الاتصال والوصف",
    "description": "الوصف",
    "descriptionAr": "الوصف (بالعربية)",
    "descriptionArPlaceholder": "ماذا يقدم هذا المحل؟ (بالعربية)",
    "phone": "الهاتف",
    "phonePlaceholder": "+20 10 1234 5678",
    "whatsapp": "رقم واتساب",
    "location": "الموقع",
    "address": "العنوان",
    "latitude": "خط العرض",
    "longitude": "خط الطول",
    "googleMapsLink": "رابط خرائط جوجل",
    "googleMapsPlaceholder": "https://maps.google.com/…",
    "socialLinks": "روابط التواصل",
    "facebook": "فيسبوك",
    "instagram": "انستغرام",
    "tiktok": "تيك توك",
    "website": "الموقع",
    "saveChanges": "حفظ التغييرات",
    "updated": "تم تحديث المحل بنجاح.",
    "failedToUpdate": "تعذر تحديث المحل."
  },
  "managerGallery": {
    "failedToLoad": "تعذر تحميل المحل.",
    "uploadPhotos": "رفع الصور",
    "uploading": "جارٍ الرفع…",
    "upload": "رفع",
    "chooseFirst": "اختر صورة واحدة على الأقل أولًا.",
    "uploaded": "تم رفع {{count}} صورة.",
    "failedUpload": "فشل الرفع.",
    "fileHint": "تم اختيار {{count}} ملف · JPG أو PNG أو WEBP · بحد أقصى 5 ميجابايت لكل ملف",
    "noPhotosTitle": "لا توجد صور بعد",
    "noPhotosSubtitle": "ارفع الصور حتى يتمكن الزوار من رؤية المحل.",
    "deleteTitle": "حذف الصورة؟",
    "deleteMessage": "ستتم إزالة هذه الصورة من المحل نهائيًا.",
    "deleteConfirm": "حذف الصورة",
    "deleteImageTitle": "حذف الصورة",
    "imageDeleted": "تم حذف الصورة.",
    "failedDelete": "تعذر حذف الصورة."
  },
  "managerHours": {
    "failedToLoad": "تعذر تحميل ساعات العمل.",
    "hint": "حدد مواعيد فتح المحل كل يوم. شارة «مفتوح الآن» في صفحتك تتحدث تلقائيًا — بما في ذلك الساعات التي تعبر منتصف الليل.",
    "saveWorkingHours": "حفظ ساعات العمل",
    "updated": "تم تحديث ساعات العمل.",
    "failedToSave": "تعذر حفظ ساعات العمل."
  },
  "managerAnalytics": {
    "forYourShopOnly": "إحصائيات محلّك فقط",
    "totalViews": "إجمالي المشاهدات",
    "viewsToday": "مشاهدات اليوم",
    "viewsWeek": "هذا الأسبوع",
    "viewsMonth": "هذا الشهر",
    "viewsLast7": "المشاهدات — آخر 7 أيام",
    "noViewData": "لا توجد بيانات مشاهدات بعد.",
    "clickThroughs": "النقرات",
    "totalClicks": "{{count}} نقرة إجمالية",
    "phone": "الهاتف",
    "whatsapp": "واتساب",
    "googleMaps": "خرائط جوجل",
    "website": "الموقع",
    "facebook": "فيسبوك",
    "instagram": "انستغرام",
    "tiktok": "تيك توك"
  },
  "managerSettings": {
    "account": "الحساب",
    "name": "الاسم",
    "email": "البريد الإلكتروني",
    "role": "الدور",
    "shopManager": "مدير محل"
  }
}
```

---

### Task 10: Wire i18n into the app root + apply language before first paint

**Files:**
- Modify: `D:\dalil\client\src\main.jsx`

- [ ] **Step 1: Rewrite `main.jsx`**

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { Toaster } from "sonner";
import App from "./App";
import i18n, { applyDocumentLanguage, getStoredLang } from "./i18n";
import "./index.css";

applyDocumentLanguage(getStoredLang());

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
    </I18nextProvider>
  </React.StrictMode>
);
```

Note: `applyDocumentLanguage` runs before the first render so the RTL attribute is present before layout — avoids a flicker.

---

### Task 11: Arabic font, default document language, RTL font-family

**Files:**
- Modify: `D:\dalil\client\index.html`
- Modify: `D:\dalil\client\src\index.css`
- Modify: `D:\dalil\client\tailwind.config.js`

- [ ] **Step 1: `index.html`** — add Cairo font + set default lang/dir

Replace the `<html lang="en">` line:

```html
<html lang="ar" dir="rtl">
```

Replace the font `<link>` (add Cairo; keep Inter):

```html
<link
  href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap"
  rel="stylesheet"
/>
```

Leave the static `<title>` and meta description as-is (they get replaced at runtime by `usePageMeta`).

- [ ] **Step 2: `src/index.css`** — RTL font family

Add to the `@layer base` block:

```css
html[dir="rtl"] body {
  font-family: "Cairo", ui-sans-serif, system-ui, sans-serif;
}
```

- [ ] **Step 3: `tailwind.config.js`** — prepend Cairo to the sans stack

```js
fontFamily: {
  sans: ["Inter", "Cairo", "ui-sans-serif", "system-ui", "sans-serif"],
},
```

---

### Task 12: `localize()` helper + locale-aware formatters + DAYS keys

**Files:**
- Create: `D:\dalil\client\src\utils\i18n.js`
- Modify: `D:\dalil\client\src\utils\formatters.js`
- Modify: `D:\dalil\client\src\utils\constants.js`

- [ ] **Step 1: Create `src/utils/i18n.js`**

```js
import i18n from "../i18n";

export function localize(obj, key) {
  if (!obj) return "";
  const isAr = i18n.language?.startsWith("ar");
  const arabic = obj[`${key}Ar`];
  if (isAr && arabic) return arabic;
  return obj[key] || "";
}
```

- [ ] **Step 2: `formatters.js`** — locale-aware

Replace `formatViews`, `formatTime`, `formatDate` (keep `cleanPhone`, `telHref`, `waHref`, `mapsHref`, `truncate` unchanged). Add the import at the top:

```js
import i18n from "../i18n";

function locale() {
  return i18n.language?.startsWith("ar") ? "ar-EG" : "en-GB";
}

export function formatViews(n) {
  const num = Number(n || 0);
  if (num >= 1000) {
    return new Intl.NumberFormat(locale(), {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(num);
  }
  return new Intl.NumberFormat(locale()).format(num);
}

export function formatTime(time) {
  if (!time || typeof time !== "string") return "—";
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h)) return time;
  const d = new Date(2000, 0, 1, h, m || 0);
  return d.toLocaleTimeString(locale(), { hour: "numeric", minute: "2-digit", hour12: true });
}

export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
```

- [ ] **Step 3: `constants.js`** — strip hardcoded day labels

Replace the `DAYS` export:

```js
export const DAYS = [
  { key: "saturday" },
  { key: "sunday" },
  { key: "monday" },
  { key: "tuesday" },
  { key: "wednesday" },
  { key: "thursday" },
  { key: "friday" },
];
```

No other change in this file — `CATEGORY_ICONS`, `categoryIcon`, `CLICK_TYPES`, `SITE_NAME`, `AREA_NAME`, `TAGLINE` stay.

---

### Task 13: Language-aware `usePageMeta`

**Files:**
- Modify: `D:\dalil\client\src\hooks\usePageMeta.js`

- [ ] **Step 1: Rewrite the hook**

```js
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export function usePageMeta(title, description) {
  const { t } = useTranslation();
  const fallback = t("meta.homeTitle");

  useEffect(() => {
    document.title = title || fallback;
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
    }
    return () => {
      document.title = t("meta.homeTitle");
    };
  }, [title, description, fallback, t]);
}
```

Callers pass fully-translated strings (built with `t()` and `localize()`), so the hook re-runs whenever the language changes (the `t` reference and `fallback` change together).

---

### Task 14: Language switcher component

**Files:**
- Create: `D:\dalil\client\src\components\common\LanguageSwitcher.jsx`

- [ ] **Step 1: Create the component**

```jsx
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { changeLanguage } from "../../i18n";

export default function LanguageSwitcher({ variant = "light" }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language?.startsWith("ar");
  const light = variant === "light";

  const container = light
    ? "inline-flex items-center rounded-xl border border-slate-200 bg-white"
    : "inline-flex items-center rounded-xl bg-white/10 ring-1 ring-white/20";
  const label = light
    ? "text-slate-600 hover:bg-slate-50"
    : "text-white hover:bg-white/10";

  return (
    <div className={container}>
      <Languages className={`mx-2 h-4 w-4 ${light ? "text-brand-600" : "text-brand-200"}`} />
      <button
        type="button"
        onClick={() => changeLanguage(isAr ? "en" : "ar")}
        aria-label={t("lang.switch")}
        className={`rounded-lg px-3 py-1.5 text-xs font-bold ${label} transition`}
      >
        {isAr ? "English" : "العربية"}
      </button>
    </div>
  );
}
```

---

## Phase 3 — Client: translate the UI

> Pattern for every component below: add `import { useTranslation } from "react-i18next";`, call `const { t } = useTranslation();`, and replace each hardcoded string with `t("ns.key", { vars })`. Where DB content is displayed, use `localize(obj, "field")` from `src/utils/i18n.js`. Components already re-render on language change because `useTranslation()` subscribes to the i18next instance.
>
> After each task, run `npm run build` (from `D:\dalil\client`) and fix any errors before moving on.

### Task 15: Navbar + Footer (nav strings + language switcher)

**Files:**
- Modify: `D:\dalil\client\src\components\common\Navbar.jsx`
- Modify: `D:\dalil\client\src\components\common\Footer.jsx`

- [ ] **Step 1: `Navbar.jsx`**

Add imports:

```jsx
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { localize } from "../../utils/i18n";
```

Add inside the component:

```jsx
const { t } = useTranslation();
```

String replacements:
- `Home` → `{t("nav.home")}` (2 places)
- `Shops` → `{t("nav.shops")}` (2 places)
- `Categories` → `{t("nav.categories")}` (button + mobile section heading)
- `All Shops` → `{t("nav.allShops")}`
- `Manager` → `{t("nav.manager")}`
- `Admin` → `{t("nav.admin")}`
- `Manager Login` → `{t("nav.managerLogin")}`
- `Admin Login` → `{t("nav.adminLogin")}`
- `aria-label="Toggle menu"` → `aria-label={t("nav.toggleMenu")}`
- Category links: `{c.name}` → `{localize(c, "name")}`
- `{AREA_NAME}` in the sr-only line → `{t("nav.area", { area: AREA_NAME })}`
- Add `<LanguageSwitcher />` in the desktop right-side div (before the "Manager" link) and inside the mobile menu (before the login buttons).

- [ ] **Step 2: `Footer.jsx`**

Add imports and `const { t } = useTranslation();`. Replace:
- Tagline paragraph → `{t("brand.description")}`
- `Explore` → `{t("footer.explore")}`
- `Home` → `{t("footer.explore")}`… actually `{t("nav.home")}`; `All Shops` → `{t("nav.allShops")}`; `Open Now` → `{t("nav.openNow")}`
- `For Business` → `{t("footer.forBusiness")}`
- `Manager Login` → `{t("nav.managerLogin")}`; `Admin Login` → `{t("nav.adminLogin")}`
- `Contact` → `{t("footer.contact")}`
- `Support: ask your local admin` → `{t("footer.support")}`
- `© {year} Dalil — ...` → `{t("footer.rights", { year: new Date().getFullYear(), area: AREA_NAME })}`
- Add `<LanguageSwitcher variant="dark" />` in the first column (below the tagline).

- [ ] **Step 3: Build check**

Run: `npm run build`

---

### Task 16: PublicLayout, NotFound, Login pages, ChangePasswordForm

**Files:**
- Modify: `D:\dalil\client\src\layouts\PublicLayout.jsx`
- Modify: `D:\dalil\client\src\pages\public\NotFound.jsx`
- Modify: `D:\dalil\client\src\components\auth\LoginPage.jsx`
- Modify: `D:\dalil\client\src\pages\auth\AdminLogin.jsx`
- Modify: `D:\dalil\client\src\pages\auth\ManagerLogin.jsx`
- Modify: `D:\dalil\client\src\components\common\ChangePasswordForm.jsx`

- [ ] **Step 1: `PublicLayout.jsx`** — move `mobileLinks` inside the component and translate

```jsx
export default function PublicLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const mobileLinks = [
    { to: "/", label: t("nav.home"), icon: Home },
    { to: "/shops", label: t("nav.shops"), icon: Store },
    { to: "/shops?openNow=true", label: t("nav.openNow"), icon: Grid2x2 },
  ];
  // ...rest unchanged
}
```

Remove the module-level `mobileLinks` array.

- [ ] **Step 2: `NotFound.jsx`**

Add `const { t } = useTranslation();`. Replace `Page not found` → `{t("notFound.title")}`, the paragraph → `{t("notFound.text")}`, `Back to Home` → `{t("notFound.backHome")}`.

- [ ] **Step 3: `LoginPage.jsx`**

Add `const { t } = useTranslation();`. Replace:
- `Welcome back!` → `{t("login.welcomeBack")}`
- `Login failed. Please check your credentials.` → `t("login.failed")`
- `Email` → `{t("login.email")}`
- `you@example.com` placeholder → `t("login.emailPlaceholder")`
- `Password` → `{t("login.password")}`
- `Sign in` → `{t("login.signIn")}`
- Show/hide aria-label → `t(showPassword ? "login.hidePassword" : "login.showPassword")`
- `← Back to the directory` → `{t("login.backToDirectory")}`

- [ ] **Step 4: `AdminLogin.jsx`**

```jsx
import { useTranslation } from "react-i18next";
import LoginPage from "../../components/auth/LoginPage";

export default function AdminLogin() {
  const { t } = useTranslation();
  return (
    <LoginPage
      role="admin"
      title={t("login.adminTitle")}
      subtitle={t("login.adminSubtitle")}
      redirectTo="/admin/dashboard"
    />
  );
}
```

- [ ] **Step 5: `ManagerLogin.jsx`** — same pattern with `t("login.managerTitle")` / `t("login.managerSubtitle")` and `redirectTo="/manager/dashboard"`.

- [ ] **Step 6: `ChangePasswordForm.jsx`**

Add `const { t } = useTranslation();`. Replace all strings with `changePassword.*` keys:
- `New password must be at least 6 characters.` → `t("changePassword.lengthWarning")`
- `New passwords do not match.` → `t("changePassword.mismatchWarning")`
- `Password changed successfully.` → `t("changePassword.success")`
- `Could not change password.` → `t("changePassword.failed")`
- Heading → `{t("changePassword.title")}`
- `Current password` / `New password` / `Confirm new password` / `Update password` → corresponding keys
- Show/hide aria-label → `t(show ? "login.hidePassword" : "login.showPassword")` (reuse login keys)

- [ ] **Step 7: Build check**

Run: `npm run build`

---

### Task 17: Shared components (Spinner, SkeletonCard, Modal, ConfirmDialog, EmptyState, Pagination, StatusBadge, StatCard, SectionHeading)

**Files:**
- Modify: `D:\dalil\client\src\components\common\Spinner.jsx`
- Modify: `D:\dalil\client\src\components\common\SkeletonCard.jsx`
- Modify: `D:\dalil\client\src\components\common\Modal.jsx`
- Modify: `D:\dalil\client\src\components\common\ConfirmDialog.jsx`
- Modify: `D:\dalil\client\src\components\common\EmptyState.jsx`
- Modify: `D:\dalil\client\src\components\common\Pagination.jsx`
- Modify: `D:\dalil\client\src\components\common\StatusBadge.jsx`
- Modify: `D:\dalil\client\src\components\dashboard\StatCard.jsx`
- Modify: `D:\dalil\client\src\components\common\SectionHeading.jsx` (no strings — no change)

- [ ] **Step 1: `Spinner.jsx`** — `aria-label="Loading"` → `aria-label={t("common.loading")}` (add `useTranslation`).

- [ ] **Step 2: `Modal.jsx`** — `aria-label="Close dialog"` → `aria-label={t("common.close")}`.

- [ ] **Step 3: `ConfirmDialog.jsx`**

Add `const { t } = useTranslation();`. Change defaults so callers without explicit labels still translate:
- `title = "Are you sure?"` → `title = t("confirm.areYouSure")` — but defaults can't call hooks. Instead: `title` prop default `undefined`, then `const resolvedTitle = title ?? t("confirm.areYouSure");` and `const resolvedConfirm = confirmLabel ?? t("common.delete");` (default `confirmLabel` to `undefined`).
- `Cancel` → `{t("common.cancel")}`
- `confirmLabel` rendering → `{resolvedConfirm}`, `title` → `{resolvedTitle}`

- [ ] **Step 4: `EmptyState.jsx`** — default `title` → `undefined`, then `const resolvedTitle = title ?? t("common.nothingFound");` and render `{resolvedTitle}`.

- [ ] **Step 5: `Pagination.jsx`** — `aria-label="Pagination"` → `aria-label={t("common.paginationLabel")}` (add key `"paginationLabel": "Pagination"` to `common` in both locale files) — or use `t("pagination.previousPage")` for prev/next: `aria-label={t("pagination.previousPage")}` and `aria-label={t("pagination.nextPage")}`. Replace the hardcoded `"…"` stays as-is.

- [ ] **Step 6: `StatusBadge.jsx`**

```jsx
const { t } = useTranslation();
```
- `Open Now` → `{t("status.openNow")}`
- `Open` → `{t("status.open")}`
- `` `Closed · opens ${formatTime(nextOpenAt)}` `` → `t("status.closedOpensAt", { time: formatTime(nextOpenAt) })`
- `Closed Now` → `{t("status.closedNow")}`

- [ ] **Step 7: `StatCard.jsx`** — `vs last period` → `{t("statCard.vsLastPeriod")}`.

- [ ] **Step 8: `SectionHeading.jsx`** — no user-facing strings; skip.

- [ ] **Step 9: Build check**

Run: `npm run build`

---

### Task 18: Shop components (ShopCard, ShopFilters, ShopGallery, WorkingHoursTable, WorkingHoursEditor, ContactButtons)

**Files:**
- Modify: `D:\dalil\client\src\components\shop\ShopCard.jsx`
- Modify: `D:\dalil\client\src\components\shop\ShopFilters.jsx`
- Modify: `D:\dalil\client\src\components\shop\ShopGallery.jsx`
- Modify: `D:\dalil\client\src\components\shop\WorkingHoursTable.jsx`
- Modify: `D:\dalil\client\src\components\dashboard\WorkingHoursEditor.jsx`
- Modify: `D:\dalil\client\src\components\shop\ContactButtons.jsx`

- [ ] **Step 1: `ShopCard.jsx`** — add `useTranslation` + `localize`.

Replace:
- `shop.name` (img alt + h3) → `localize(shop, "name")`
- `shop.category?.name || "Shop"` → `localize(shop.category, "name") || t("shopCard.categoryFallback")`
- `truncate(shop.description, 110) || "Local shop in Abou Ghaleb."` → `truncate(localize(shop, "description"), 110) || t("shopCard.descriptionFallback")`
- `Featured` → `{t("shopCard.featured")}`
- `View details` → `{t("shopCard.viewDetails")}`
- `aria-label="Copy shop link"` → `aria-label={t("shopCard.copyLink")}`
- `Link copied to clipboard` → `t("common.linkCopied")`
- `Could not copy link` → `t("common.couldNotCopy")`

- [ ] **Step 2: `ShopFilters.jsx`** — add `useTranslation`.
- `placeholder="Search for a shop or service…"` → `placeholder={t("shopFilters.searchPlaceholder")}`
- `Filters` → `{t("shopFilters.filters")}`
- `All categories` → `{t("shopFilters.allCategories")}`
- Option names: `{c.name}` → `{localize(c, "name")}` (import `localize`)
- `Open Now` → `{t("shopFilters.openNow")}`
- `Search` → `{t("shopFilters.search")}` → use `t("common.search")`
- `Reset` → `{t("common.reset")}`

- [ ] **Step 3: `ShopGallery.jsx`** — add `useTranslation`.
- Empty-state icon alt → wrap with `aria-label={t("shopGallery.noImages")}` (icon has no label today; keep as-is)
- `alt={`${name} — photo ${index + 1}`}` → `` alt={t("shopGallery.photoAlt", { name, number: index + 1 })} ``
- `aria-label="Previous photo"` → `aria-label={t("shopGallery.previousPhoto")}`
- `aria-label="Next photo"` → `aria-label={t("shopGallery.nextPhoto")}`
- `` aria-label={`Show photo ${i + 1}`} `` → `aria-label={t("shopGallery.showPhoto", { number: i + 1 })}`

- [ ] **Step 4: `WorkingHoursTable.jsx`** — add `useTranslation`.
- `{d.label}` → `{t(\`days.${d.key}\`)}`
- `Today` badge → `{t("common.today")}`
- `Closed` → `{t("common.closed")}`
- `${formatTime(slot.open)} – ${formatTime(slot.close)}` stays (formatters are now locale-aware)

- [ ] **Step 5: `WorkingHoursEditor.jsx`** — add `useTranslation`.
- `{d.label}` → `{t(\`days.${d.key}\`)}`
- `to` → `{t("days.to")}`
- `` aria-label={`${d.label} opening time`} `` → `aria-label={t("days.openingTime", { day: t(\`days.${d.key}\`) })}`
- `` aria-label={`${d.label} closing time`} `` → `aria-label={t("days.closingTime", { day: t(\`days.${d.key}\`) })}`

- [ ] **Step 6: `ContactButtons.jsx`** — add `useTranslation`.
- `toast.success("Link copied to clipboard")` → `toast.success(t("common.linkCopied"))`
- `toast.error("Could not copy link")` → `toast.error(t("common.couldNotCopy"))`
- `` label={`Call ${cleanPhone(shop.phone)}`} `` → `label={t("contact.call", { phone: cleanPhone(shop.phone) })}`
- `waHref(shop.whatsapp || shop.phone, \`Hello ${shop.name}, ...\`)` → pass `t("contact.whatsappMessage", { name: localize(shop, "name") })`
- `Chat on WhatsApp` → `{t("contact.chatWhatsApp")}`
- `Get Directions` → `{t("contact.getDirections")}`
- `Open Website` → `{t("contact.openWebsite")}`
- `Facebook` / `Instagram` / `TikTok` → `t("contact.facebook")` / `t("contact.instagram")` / `t("contact.tiktok")`
- `Link Copied` / `Copy Link` → `t("contact.linkCopied")` / `t("contact.copyLink")`

- [ ] **Step 7: Build check**

Run: `npm run build`

---

### Task 19: Sidebar + dashboard charts + admin/manager layouts

**Files:**
- Modify: `D:\dalil\client\src\components\dashboard\Sidebar.jsx`
- Modify: `D:\dalil\client\src\components\dashboard\SimpleBarChart.jsx` (no strings — skip)
- Modify: `D:\dalil\client\src\layouts\AdminLayout.jsx`
- Modify: `D:\dalil\client\src\layouts\ManagerLayout.jsx`

- [ ] **Step 1: `Sidebar.jsx`** — add `useTranslation`.
- `aria-label="Close sidebar"` → `aria-label={t("sidebar.closeSidebar")}`
- `Logout` → `{t("sidebar.logout")}`

- [ ] **Step 2: `AdminLayout.jsx`** — add `useTranslation`.

Move `navItems` and `titles` inside the component (they need `t`):

```jsx
export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { to: "/admin/dashboard", label: t("adminLayout.dashboard"), icon: LayoutDashboard },
    { to: "/admin/shops", label: t("adminLayout.shops"), icon: Store },
    { to: "/admin/managers", label: t("adminLayout.managers"), icon: Users },
    { to: "/admin/categories", label: t("adminLayout.categories"), icon: FolderTree },
    { to: "/admin/analytics", label: t("adminLayout.analytics"), icon: BarChart3 },
    { to: "/admin/settings", label: t("adminLayout.settings"), icon: Settings },
  ];

  const titles = {
    "/admin/dashboard": t("adminLayout.dashboard"),
    "/admin/shops": t("adminLayout.shopManagement"),
    "/admin/managers": t("adminLayout.managerManagement"),
    "/admin/categories": t("adminLayout.categories"),
    "/admin/analytics": t("adminLayout.analytics"),
    "/admin/settings": t("adminLayout.settings"),
  };
  // ...
}
```

Remove the module-level arrays. Replace `brand="Dalil Admin"` → `brand={t("adminLayout.brand")}`, `aria-label="Open sidebar"` → `aria-label={t("sidebar.openSidebar")}`, `|| "Admin"` → `|| t("adminLayout.titleFallback")`.

- [ ] **Step 3: `ManagerLayout.jsx`** — same pattern with `managerLayout.*` keys (`brand` → `t("managerLayout.brand")`, titles per route: dashboard, myShop, galleryTitle, hours, analytics, changePassword).

- [ ] **Step 4: Build check**

Run: `npm run build`

---

### Task 20: Public pages (Home, Shops, CategoryShops, ShopDetails)

**Files:**
- Modify: `D:\dalil\client\src\pages\public\Home.jsx`
- Modify: `D:\dalil\client\src\pages\public\Shops.jsx`
- Modify: `D:\dalil\client\src\pages\public\CategoryShops.jsx`
- Modify: `D:\dalil\client\src\pages\public\ShopDetails.jsx`

- [ ] **Step 1: `Home.jsx`** — add `useTranslation` + `localize`; import `AREA_NAME` (already) and keep `TAGLINE` import only if still used (replace with `t("brand.tagline")`).

Replace:
- `usePageMeta("Dalil — ...", TAGLINE)` → `usePageMeta(t("meta.homeTitle"), t("brand.tagline"))`
- `Your guide to {AREA_NAME}` → `{t("home.guide", { area: AREA_NAME })}`
- H1 → `{t("home.heroTitle")}`
- Hero paragraph → `{t("home.heroSubtitle", { area: AREA_NAME })}`
- Search placeholder → `t("home.searchPlaceholder")`, `aria-label="Search shops"` → `aria-label={t("home.searchLabel")}`, button → `{t("home.searchButton")}`
- `Browse by category` → `{t("home.browseByCategory")}`
- `See what's open now` → `{t("home.seeOpenNow")}`
- `SectionHeading` eyebrow/title/subtitle → `home.categoriesEyebrow/Title/Subtitle` (with `area`)
- `View all shops` → `{t("home.viewAllShops")}`
- EmptyStates → `home.noCategoriesTitle/Subtitle`
- `{c.shopCount} shops` → `{t("home.shopCount", { count: c.shopCount })}`; `{c.name}` → `{localize(c, "name")}`
- Popular/latest headings → `home.popularEyebrow/Title/Subtitle`, `home.latestEyebrow/Title/Subtitle`; empty states → `home.noPopularTitle/Subtitle`, `home.noLatestTitle/Subtitle`
- CTA → `home.ownShopTitle`, `home.ownShopText`, `home.exploreDirectory`, `home.administratorAccess`

- [ ] **Step 2: `Shops.jsx`**

- `usePageMeta("All Shops — ...", "...")` → `usePageMeta(t("meta.shopsTitle"), t("meta.shopsDescription"))`
- H1 `All Shops` → `{t("shops.title")}`
- Count line → `` `${data.pagination.total} ...` `` → `t("shops.count", { count: data.pagination.total })`
- Fallback → `{t("shops.fallback")}`
- `Failed to load shops.` → `t("shops.failedToLoad")`
- EmptyState error → `shops.errorTitle` + subtitle `{error}`
- No-match EmptyState → `shops.noMatchTitle/Subtitle`, `actionLabel={t("shops.resetFilters")}`

- [ ] **Step 3: `CategoryShops.jsx`** — add `useTranslation` + `localize`.

- `usePageMeta(...)` → `usePageMeta(category ? t("meta.categoryTitle", { name: localize(category, "name") }) : t("meta.categoryFallbackTitle"), localize(category, "description"))`
- `{category.name}` (h1) → `{localize(category, "name")}`
- Description → `localize(category, "description") || t("categoryShops.defaultDescription", { name: localize(category, "name") })`
- EmptyStates → `categoryShops.notFoundTitle/Subtitle`, `categoryShops.noShopsTitle/Subtitle`, `actionLabel={t("categoryShops.browseAll")}`
- Back link → `{t("categoryShops.backToAll")}`

- [ ] **Step 4: `ShopDetails.jsx`** — add `useTranslation` + `localize`.

- `usePageMeta(...)` → `usePageMeta(shop ? t("meta.shopTitle", { name: localize(shop, "name") }) : t("meta.shopFallbackTitle"), localize(shop, "description").slice(0, 160))`
- `Loading shop…` → `{t("shopDetails.loading")}`
- EmptyState → `shopDetails.notFoundTitle/Subtitle`, `actionLabel={t("shopDetails.browseAll")}`
- Breadcrumb `Home`/`Shops` → `t("shopDetails.home")` / `t("shopDetails.shops")`
- `{formatViews(shop.views)} views` → `{t("shopDetails.views", { count: formatViews(shop.views) })}`
- `{shop.name}` (h1) → `{localize(shop, "name")}`
- Category badge `{shop.category.name}` → `{localize(shop.category, "name")}`
- `{shop.description || "No description yet."}` → `{localize(shop, "description") || t("shopDetails.noDescription")}`
- `Get in touch` → `{t("shopDetails.getInTouch")}`
- `Location` → `{t("shopDetails.location")}`
- `No address provided.` → `{t("shopDetails.noAddress")}`
- `Working hours` → `{t("shopDetails.workingHours")}`
- `Back to all shops` → `{t("shopDetails.backToAll")}`
- `<ShopGallery images={shop.images} name={localize(shop, "name")} />`

- [ ] **Step 5: Build check**

Run: `npm run build`

---

### Task 21: Admin pages (Dashboard, Shops, Categories, Managers, Analytics, Settings)

**Files:**
- Modify: `D:\dalil\client\src\pages\admin\AdminDashboard.jsx`
- Modify: `D:\dalil\client\src\pages\admin\AdminShops.jsx`
- Modify: `D:\dalil\client\src\pages\admin\AdminCategories.jsx`
- Modify: `D:\dalil\client\src\pages\admin\AdminManagers.jsx`
- Modify: `D:\dalil\client\src\pages\admin\AdminAnalytics.jsx`
- Modify: `D:\dalil\client\src\pages\admin\AdminSettings.jsx`

- [ ] **Step 1: `AdminDashboard.jsx`** — add `useTranslation`.
- `usePageMeta("Dashboard — Dalil Admin", "")` → `usePageMeta(t("meta.adminDashboard"), "")`
- StatCards → `adminDashboard.totalShops/activeShops/inactiveShops/managers/totalViews`
- Second row → `adminDashboard.viewsToday/viewsWeek/viewsMonth`
- Chart card → `adminDashboard.viewsLast7`; empty → `adminDashboard.noViewData`
- Top shops → `adminDashboard.topShops`; empty → `adminDashboard.noDataYet`
- `Full analytics` → `{t("adminDashboard.fullAnalytics")}`
- Top shop names → `{localize(s, "name")}` (import `localize`)

- [ ] **Step 2: `AdminShops.jsx`** — add `useTranslation` + `localize`.

Key changes beyond string swaps:
- `emptyForm()` gains `nameAr: "", descriptionAr: ""`
- `openEdit(shop)` sets `nameAr: shop.nameAr || "", descriptionAr: shop.descriptionAr || ""`
- `handleSave` payload adds `nameAr: form.nameAr, descriptionAr: form.descriptionAr`
- Table `{shop.name}` → keep English `shop.name` (management view) — no change. `{shop.category?.name || "—"}` → `{localize(shop.category, "name") || "—"}`. `{shop.manager?.name || "—"}` unchanged.
- `title={shop.status === "active" ? "Deactivate shop" : "Activate shop"}` → `title={t(shop.status === "active" ? "adminShops.deactivate" : "adminShops.activate")}`
- Modal: add a new "Arabic" subsection under the description block:
  - Label `Shop name (Arabic)` → `t("adminShops.shopNameAr")`, input bound to `form.nameAr`, placeholder `t("adminShops.shopNameArPlaceholder")`
  - Label `Description (Arabic)` → `t("adminShops.descriptionAr")`, textarea bound to `form.descriptionAr`, placeholder `t("adminShops.descriptionArPlaceholder")`
- All toasts/headers/placeholders/labels → their `adminShops.*` keys (`nameRequired`, `categoryRequired`, `updated`, `created`, `deactivated`, `activated`, `deleted`, `failedToLoad`, `failedToSave`, `failedStatus`, `failedDelete`, `editShop`, `createShop`, `shopName`, `shopNamePlaceholder`, `category`, `selectCategory`, `status`, `managerOptional`, `none`, `phone`, `phonePlaceholder`, `whatsapp`, `whatsappPlaceholder`, `description`, `descriptionPlaceholder`, `address`, `addressPlaceholder`, `latitude`, `longitude`, `googleMapsLink`, `googleMapsPlaceholder`, `socialLinks`, `facebookUrl`, `instagramUrl`, `tiktokUrl`, `websiteUrl`, `workingHours`, `hide`, `colShop/Category/Manager/Views/Created/Status/Actions`, `deleteTitle`, `deleteMessage` (with `name`), `deleteConfirm`)
- `title="Edit"` / `title="Delete"` → `t("common.edit")` / `t("common.delete")`
- `Cancel` → `t("common.cancel")`; `Save changes` → `t("common.saveChanges")`; `Create shop` → `t("adminShops.createShop")` (button); `New Shop` → `t("adminShops.newShop")`

- [ ] **Step 3: `AdminCategories.jsx`** — add `useTranslation` + `localize`.

- `emptyForm()` gains `nameAr: "", descriptionAr: ""`
- `openEdit(c)` sets both
- `handleSave` sends the full form (service already persists Arabic fields)
- Table `{c.name}` → keep English; `{c.description || "—"}` unchanged
- Modal adds: `Name (Arabic)` input (`form.nameAr`, placeholder `adminCategories.nameArPlaceholder`), `Description (Arabic)` textarea (`form.descriptionAr`, placeholder `adminCategories.descriptionArPlaceholder`)
- All strings → `adminCategories.*` keys (mirroring the `adminShops` pattern: `newCategory`, `noCategoriesTitle/Subtitle`, `nameRequired`, `updated/created/deactivated/activated/deleted`, `failedToLoad/failedToSave/failedStatus/failedDelete`, `editCategory/createCategory`, `name`, `description`, `icon`, `categoryActive`, column headers, `deleteTitle/Message/Confirm`)
- `Active`/`Inactive` badge → `t("common.active")` / `t("common.inactive")`

- [ ] **Step 4: `AdminManagers.jsx`** — add `useTranslation`.

- `usePageMeta("Manager Management — Dalil Admin", "")` → `t("meta.adminManagers")`
- All strings → `adminManagers.*` keys (`newManager`, `noManagersTitle/Subtitle`, `nameRequired`, `shopRequired`, `passwordRequired`, `updated/created/deleted`, `disabled/enabled` (with `name`), `passwordReset` (with `name`), `failedToLoad/failedToSave/failedStatus/failedReset/failedDelete`, `editManager/createManager`, `fullName`, `email`, `tempPassword` + `tempPasswordPlaceholder` + `tempPasswordHint`, `linkedShop`, `selectShop`, `inactiveTag`, `accountActive`, `resetTitle`, `resetText` (name inside `<strong>` — render with `<Trans>` from `react-i18next`), `newTempPassword`, `newPasswordPlaceholder`, `resetPassword`, column headers, `deleteTitle/Message/Confirm`)
- `title="Edit"`/`title="Reset password"`/`title="Delete"` → `t("common.edit")` / `t("adminManagers.resetPassword")` / `t("common.delete")`
- `{m.shop?.name || "—"}` → `{localize(m.shop, "name") || "—"}`
- `Active`/`Disabled` → `t("common.active")` / `t("adminManagers.disabled")` — note `disabled` also exists in `common`; use `common.disabled`.

For the `<strong>` interpolation in `resetText`, use `Trans`:

```jsx
import { Trans } from "react-i18next";
// ...
<p className="text-sm text-slate-600">
  <Trans i18nKey="adminManagers.resetText" values={{ name: resetTarget?.name }} />
</p>
```

- [ ] **Step 5: `AdminAnalytics.jsx`** — add `useTranslation` + `localize`.
- `usePageMeta` → `t("meta.adminAnalytics")`
- StatCards → `adminAnalytics.totalShops/managers/totalViews/categories`, then `viewsToday/viewsWeek/viewsMonth`
- Chart → `adminAnalytics.viewsLast7` + `noViewData`
- `Most popular` → `{t("adminAnalytics.mostPopular")}`; `No data yet.` → `{t("adminAnalytics.noDataYet")}`
- `{formatViews(s.views)} views` → `{t("adminAnalytics.views", { count: formatViews(s.views) })}`
- `{s.name}` → `{localize(s, "name")}`

- [ ] **Step 6: `AdminSettings.jsx`** — add `useTranslation`.
- `usePageMeta` → `t("meta.adminSettings")`
- `Account` → `{t("adminSettings.account")}`, `Name`/`Email`/`Role` → keys, `Administrator` → `{t("adminSettings.administrator")}`

- [ ] **Step 7: Build check**

Run: `npm run build`

---

### Task 22: Manager pages (Dashboard, ShopEdit, Gallery, Hours, Analytics, Settings)

**Files:**
- Modify: `D:\dalil\client\src\pages\manager\ManagerDashboard.jsx`
- Modify: `D:\dalil\client\src\pages\manager\ManagerShopEdit.jsx`
- Modify: `D:\dalil\client\src\pages\manager\ManagerGallery.jsx`
- Modify: `D:\dalil\client\src\pages\manager\ManagerHours.jsx`
- Modify: `D:\dalil\client\src\pages\manager\ManagerAnalytics.jsx`
- Modify: `D:\dalil\client\src\pages\manager\ManagerSettings.jsx`

- [ ] **Step 1: `ManagerDashboard.jsx`** — add `useTranslation` + `localize`.
- `usePageMeta` → `t("meta.managerDashboard")`
- `{shop.name}` → `{localize(shop, "name")}`
- `Your assigned shop · {views} total views` → `{t("managerDashboard.assignedShop", { views: formatViews(shop.views) })}`
- StatCards → `managerDashboard.totalViews/viewsToday/viewsWeek/viewsMonth`
- Chart → `managerDashboard.viewsLast7` + `noViews`
- `Engagement` → `{t("managerDashboard.engagement")}`
- `clicksList` labels → translate in the map: `Phone Clicks` → `t("managerDashboard.phoneClicks")`, `WhatsApp Clicks` → `t("managerDashboard.whatsappClicks")`, `Maps Clicks` → `t("managerDashboard.mapsClicks")`, `Website Clicks` → `t("managerDashboard.websiteClicks")`. Since `clicksList` is built inside the component, `t` is in scope.

- [ ] **Step 2: `ManagerShopEdit.jsx`** — add `useTranslation`.

- `usePageMeta` → `t("meta.managerShop")`
- `getMyShop` form init gains `nameAr: s.nameAr || "", descriptionAr: s.descriptionAr || ""`
- `handleSave` payload adds `nameAr: form.nameAr, descriptionAr: form.descriptionAr`
- Info card text → `{t("managerShopEdit.info")}`
- `Contact & description` → `{t("managerShopEdit.contactDescription")}`
- Add Arabic fields after the Description textarea:
  - `Description (Arabic)` label → `t("managerShopEdit.descriptionAr")`, textarea `form.descriptionAr`, placeholder `t("managerShopEdit.descriptionArPlaceholder")`
  - `Name (Arabic)` label → `t("adminShops.shopNameAr")` (reuse), input `form.nameAr`, placeholder `t("adminShops.shopNameArPlaceholder")`
- `Phone` / `WhatsApp number` / `Location` / `Address` / `Latitude` / `Longitude` / `Google Maps link` / `Social links` / `Facebook` / `Instagram` / `TikTok` / `Website` → `managerShopEdit.*` keys
- `Save changes` → `{t("managerShopEdit.saveChanges")}`
- Toasts → `managerShopEdit.updated` / `managerShopEdit.failedToLoad` / `managerShopEdit.failedToUpdate`

- [ ] **Step 3: `ManagerGallery.jsx`** — add `useTranslation`.
- `usePageMeta` → `t("meta.managerGallery")`
- All toasts/strings → `managerGallery.*` keys (`failedToLoad`, `uploadPhotos`, `uploading`, `upload`, `chooseFirst`, `uploaded` (count), `failedUpload`, `fileHint` (count), `noPhotosTitle/Subtitle`, `deleteTitle/Message/Confirm`, `imageDeleted`, `failedDelete`)
- `title="Delete image"` → `title={t("managerGallery.deleteImageTitle")}`
- `{files.length} image(s) uploaded.` → `t("managerGallery.uploaded", { count: files.length })`
- `{files.length} file(s) selected ...` → `t("managerGallery.fileHint", { count: files.length })`

- [ ] **Step 4: `ManagerHours.jsx`** — add `useTranslation`.
- `usePageMeta` → `t("meta.managerHours")`
- Hint → `{t("managerHours.hint")}`
- Button → `{t("managerHours.saveWorkingHours")}`
- Toasts → `managerHours.updated` / `managerHours.failedToLoad` / `managerHours.failedToSave`

- [ ] **Step 5: `ManagerAnalytics.jsx`** — add `useTranslation` + `localize`.
- `usePageMeta` → `t("meta.managerAnalytics")`
- `{shop.name}` → `{localize(shop, "name")}`
- `Analytics for your shop only` → `{t("managerAnalytics.forYourShopOnly")}`
- StatCards → `managerAnalytics.totalViews/viewsToday/viewsWeek/viewsMonth`
- Chart → `managerAnalytics.viewsLast7` + `noViewData`
- `Click-throughs` → `{t("managerAnalytics.clickThroughs")}`
- `{totalClicks} total action clicks` → `{t("managerAnalytics.totalClicks", { count: totalClicks })}`
- `clickRows` labels → translate in the map: `Phone`→`t("managerAnalytics.phone")`, `WhatsApp`→`t("managerAnalytics.whatsapp")`, `Google Maps`→`t("managerAnalytics.googleMaps")`, `Website`→`t("managerAnalytics.website")`, `Facebook`→`t("managerAnalytics.facebook")`, `Instagram`→`t("managerAnalytics.instagram")`, `TikTok`→`t("managerAnalytics.tiktok")`

- [ ] **Step 6: `ManagerSettings.jsx`** — add `useTranslation`.
- `usePageMeta` → `t("meta.managerSettings")`
- `Account`/`Name`/`Email`/`Role` → `managerSettings.*`; `Shop Manager` → `{t("managerSettings.shopManager")}`

- [ ] **Step 7: Build check**

Run: `npm run build`

---

### Task 23: Localize the axios fallback message

**Files:**
- Modify: `D:\dalil\client\src\services\api.js`

- [ ] **Step 1: Use `i18n.t` for the fallback**

```js
import axios from "axios";
import i18n from "../i18n";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_API,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || i18n.t("common.somethingWentWrong");
    error.safeMessage = message;
    return Promise.reject(error);
  }
);

export default api;
```

Note: server-provided `message` values remain English (per design). Only the no-server-response fallback is translated.

---

## Phase 4 — Verification

### Task 24: Full verification

- [ ] **Step 1: Server tests**

Run (from `D:\dalil\server`): `npm test`
Expected: all passing (35 tests).

- [ ] **Step 2: Client build**

Run (from `D:\dalil\client`): `npm run build`
Expected: build succeeds, no undefined-key warnings, no unused-import errors.

- [ ] **Step 3: Seed re-run**

Run (from `D:\dalil\server`): `npm run seed`
Expected: backfill logs show Arabic fields populated for existing records; second run reports "already complete".

- [ ] **Step 4: Manual RTL + language checks** (browser, with dev servers running)

1. Home loads in Arabic with RTL (`<html dir="rtl" lang="ar">`), Cairo font applied.
2. Toggle to English in the Navbar → layout flips to LTR, all strings English; category/shop names switch to English. Reload keeps the choice.
3. Shop detail shows Arabic name/description for seeded shops; gallery alt text localized; working-hours day names Arabic; open/closed badge translated.
4. `formatViews(1200)` shows compact localized number; `formatTime("09:00")` shows Arabic 12h time.
5. Admin panel (login as `admin@example.com`): dashboard/charts labels Arabic; Shops form has Arabic name/description fields that persist (check list + DB); Categories form has Arabic fields; Managers screens Arabic.
6. Manager panel (login as seeded manager): Shop edit shows Arabic name/description fields, saves them; Hours/Analytics/Gallery Arabic.
7. Confirm dialog buttons, pagination, toasts, empty states all translate.

- [ ] **Step 5: Grep for leftover hardcoded strings**

Run (from `D:\dalil\client`):

```bash
rg -n '>[A-Z][a-z]+ ' src --glob '*.jsx' | rg -v 'className|https?://|style=|import |const |function |export '
```

Manually review any hits — translate stragglers or ignore false positives (e.g. `Trans`, brand names, formatters).

---

## Self-Review

**Spec coverage:**
- Section 1 (i18n foundation): Tasks 8–11, 14–16 ✓
- Section 2 (DB bilingual content): Tasks 1–7 (server), Task 18/21/22 (localize + forms) ✓
- Section 3 (formatters/dates/coverage): Tasks 12–13, 17–23 ✓
- Out-of-scope items (server message translation, mirrored icons, async locales) correctly excluded ✓

**Placeholders:** no TBD/TODO; every task contains exact file paths and concrete replacements.

**Type consistency:** `localize(obj, "name")` used everywhere; server returns `nameAr`/`descriptionAr`; `DAYS` items expose only `.key`; locale keys match `en.json`/`ar.json` exactly (referenced `adminShops.shopNameAr` from `ManagerShopEdit` exists in both files).

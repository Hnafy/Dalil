# Delivery Drivers Management — Design

Date: 2026-08-11

## Overview

Add an admin-only **Delivery Drivers** management feature to the existing Dalil
platform. Admins can view, add, edit, and delete delivery drivers, filter them by
vehicle type, and search by name or phone. Drivers are organized into four vehicle
categories: Motorcycle, Tuk Tuk, Private Car, and Pickup / Small Transport Truck.

Decisions confirmed with the user:
- Driver phone numbers are **unique** across all drivers (409 on duplicate).
- The feature is **admin-only** — no public visitor-side display.

## Approach

Follow the project's existing layered convention exactly:

- New `Driver` Mongoose model + `driverService.js` service.
- Driver handlers added to the existing `adminController.js`.
- Routes added to `adminRoutes.js` under `/api/admin/drivers` (already protected by
  `protect` + `restrictTo("admin")`).
- Photo uploaded through the existing Cloudinary service (multer single upload),
  stored as `{ url, publicId }` like shop images.
- New `AdminDrivers.jsx` page wired into the existing admin sidebar and routes.
- i18n strings added to both `en.json` and `ar.json`.
- Mocha + supertest tests appended to `server/tests/api.test.js`.

## Data Model

`server/src/models/Driver.js` (CommonJS, `timestamps: true`, mirrors `Category`/`Shop` style):

```js
{
  name: { type: String, required: [true, "Driver name is required"], trim: true, maxlength: 80 },
  phone: { type: String, required: [true, "Mobile number is required"], unique: true, trim: true, maxlength: 20 },
  vehicleType: { type: String, enum: ["motorcycle", "tuk_tuk", "private_car", "pickup_truck"], required: true },
  photo: { url: { type: String, default: "" }, publicId: { type: String, default: "" } }
}
```

- `photo` is optional. Stored as `{ url, publicId }` (not a plain string) so the
  old Cloudinary asset can be removed when a photo is replaced or the driver deleted.
- `phone` is unique; duplicates rejected with 409.

Vehicle type enum values: `motorcycle`, `tuk_tuk`, `private_car`, `pickup_truck`.

## Backend

### Service — `server/src/services/driverService.js`

- `listDrivers({ search, vehicleType, page, limit })` — regex search on name or
  phone (escaped, like `shopService`), optional vehicleType filter, sorted newest
  first, paginated. Returns `{ drivers, pagination, stats }`.
- `stats` — `total` plus counts per vehicle type via `countDocuments`, computed in
  one aggregation so the Drivers page shows live category counts.
- `getDriverById(id)` — 404 if missing.
- `createDriver(data)` — duplicate-phone explicit 409 check, then create.
- `updateDriver(id, data)` — 404 if missing; duplicate-phone 409 (excluding self);
  if a new photo file was uploaded, delete the old Cloudinary asset then upload the
  new one; if `removePhoto` is true, clear the photo (and delete the Cloudinary asset).
- `deleteDriver(id)` — 404 if missing; delete Cloudinary photo asset if present; remove doc.

### Controller — `adminController.js`

Add a `Drivers` section with `listDrivers`, `getDriver`, `createDriver`,
`updateDriver`, `deleteDriver`, following the existing handler style. Controllers
receive `req.body` (populated by multer for multipart) plus `req.file`.

### Routes — `adminRoutes.js`

Mounted under the existing `router.use(protect, restrictTo("admin"))` guard:

| Method | Path | Notes |
|--------|------|-------|
| GET | `/drivers` | `?search=&vehicleType=&page=&limit=` → `{ drivers, pagination, stats }` |
| GET | `/drivers/:id` | id validated as MongoId |
| POST | `/drivers` | `upload.single("photo")`, multipart/form-data |
| PATCH | `/drivers/:id` | `upload.single("photo")`, photo optional; keeps existing photo unless replaced or removed |
| DELETE | `/drivers/:id` | id validated as MongoId |

### Validation (express-validator, same style as existing routes)

- `name` — required, trimmed, max 80.
- `phone` — required, trimmed, max 20, loose format `/^\+?[0-9][0-9\s-]{8,19}$/`.
- `vehicleType` — required, `.isIn(["motorcycle", "tuk_tuk", "private_car", "pickup_truck"])`.
- Photo — optional; mime filtered by the existing `uploadMiddleware`
  (jpg/jpeg/png/webp, max 5MB). Invalid files rejected with a 400.
- `removePhoto` — optional boolean on PATCH.

### Error handling

Reuses the existing `AppError` + `errorHandler` (already maps ValidationError, Mongo
11000 → 409, CastError, MulterError). If Cloudinary is not configured, photo uploads
fail with the existing graceful 503 ("Image uploads are disabled").

## Frontend

### Page — `client/src/pages/admin/AdminDrivers.jsx` (route `/admin/drivers`)

- **Vehicle-type tabs**: five tab-cards — **All** plus Motorcycle (🏍️), Tuk Tuk
  (🛺), Private Car (🚗), Pickup / Small Transport Truck (🚚) — each showing its live
  count from `stats`. Clicking filters the table (server-side via `vehicleType`).
- **Toolbar**: search input (name or phone, Enter to search, resets to page 1) and a
  **New Driver** button, matching `AdminShops`.
- **Table**: photo (clean default avatar placeholder when no photo), name, phone,
  vehicle-type badge, created date, edit/delete actions. Same table styling/classes
  as `AdminShops`.
- **Add/Edit modal** (existing `Modal` component):
  - Photo picker with `URL.createObjectURL` preview; client-side validation
    (jpg/jpeg/png/webp, ≤5MB); optional. Edit mode shows the existing photo and
    keeps it unless a new file is selected or "Remove photo" is clicked.
  - Name input (required), phone input (required), vehicle type select (required,
    exactly the four options).
  - Save button with `Spinner` loading state; sonner toasts on success/error.
- **Delete**: existing `ConfirmDialog` — "Are you sure you want to delete this driver?"
- **States**: `SkeletonTable` while loading, `EmptyState` when no drivers match,
  toast errors via the existing `safeMessage` interceptor.

### Navigation — `client/src/layouts/AdminLayout.jsx`

- Add `{ to: "/admin/drivers", label: t("adminLayout.drivers"), icon: Truck }`
  (lucide `Truck`) after the Shops item.
- Add `"/admin/drivers": t("adminLayout.drivers")` to the header titles map.
- Do not modify or remove existing items.

### Routes — `client/src/routes/AppRoutes.jsx`

- Add `<Route path="drivers" element={<AdminDrivers />} />` under the admin layout.

### Service — `client/src/services/adminService.js`

- `adminGetDrivers(params)` → `api.get("/admin/drivers", { params })`
- `adminGetDriver(id)`
- `adminCreateDriver(formData)` / `adminUpdateDriver(id, formData)` → POST/PATCH with
  FormData (multipart for photo)
- `adminDeleteDriver(id)`

### i18n — `en.json` and `ar.json`

New keys: `meta.adminDrivers`, `adminLayout.drivers`, `drivers.vehicleTypes.*`
(motorcycle/tuk_tuk/private_car/pickup_truck labels), and an `adminDrivers.*` block
(search placeholder, new driver, table columns, modal fields, toasts, empty state,
delete dialog, validation messages, remove-photo label).

Vehicle type labels:
- Motorcycle / موتوسيكل
- Tuk Tuk / توك توك
- Private Car / سيارة خاصة
- Pickup / Small Transport Truck / بيك أب أو سيارة نقل صغيرة

## Statistics

`stats` returned by `GET /api/admin/drivers`: total + per-vehicle-type counts.
Displayed as the four category cards (with counts) and the All tab total on the
Drivers page. The existing 5-card admin dashboard grid is left untouched.

## Testing

Append an **"Admin drivers"** describe block to `server/tests/api.test.js`
(requires MongoDB, like existing tests):

- Unauthenticated access → 401.
- Manager role access → 403.
- Create driver (JSON, no photo) → 201 with correct fields.
- Create with invalid vehicleType → 400.
- Create duplicate phone → 409.
- List with vehicleType filter and search → correct subset + stats.
- GET by id → 200; invalid id → 400; missing → 404.
- PATCH name/phone/vehicleType → 200; duplicate phone → 409; keep photo when none
  uploaded.
- DELETE → 200; subsequent GET → 404.
- Photo-upload flows are covered manually (Cloudinary not configured in CI), same as
  existing image tests.

## Files

Created:
- `server/src/models/Driver.js`
- `server/src/services/driverService.js`
- `client/src/pages/admin/AdminDrivers.jsx`

Modified:
- `server/src/routes/adminRoutes.js`
- `server/src/controllers/adminController.js`
- `server/tests/api.test.js`
- `client/src/routes/AppRoutes.jsx`
- `client/src/layouts/AdminLayout.jsx`
- `client/src/services/adminService.js`
- `client/src/i18n/locales/en.json`
- `client/src/i18n/locales/ar.json`

## Environment variables

None new. Reuses the existing optional Cloudinary config
(`CLOUDINARY_URL` / `CLOUDINARY_CLOUD_NAME` + key + secret). Without it, photo
uploads are gracefully disabled (503) exactly like the existing manager image flow.

## Out of scope

- No public/visitor-facing display of drivers.
- No linking drivers to specific shops.

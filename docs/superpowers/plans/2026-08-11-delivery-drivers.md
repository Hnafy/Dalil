# Delivery Drivers Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-only Delivery Drivers management feature (CRUD, vehicle-type filtering, search, photo upload, stats) to the existing Dalil platform.

**Architecture:** Follows the existing layered convention exactly: a Mongoose `Driver` model + `driverService.js`, driver handlers added to the existing `adminController.js`, routes added to the existing `adminRoutes.js` under `/api/admin/drivers` (already behind `protect` + `restrictTo("admin")`). Photos upload via the existing Cloudinary service and are stored as `{ url, publicId }`. The frontend adds an `AdminDrivers.jsx` page, a sidebar item, a route, i18n strings, and API service functions using the existing Modal/ConfirmDialog/EmptyState/Pagination/SkeletonTable components.

**Tech Stack:** Node.js, Express, Mongoose/MongoDB, multer, Cloudinary (optional), Mocha + supertest; React 19, Vite, React Router 7, Tailwind CSS, lucide-react, react-i18next (en/ar), sonner toasts.

**Spec:** `docs/superpowers/specs/2026-08-11-delivery-drivers-design.md`

**Decisions:** Driver phone numbers are unique (409 on duplicate). Feature is admin-only (no public display).

---

## Task 1: Backend — Driver model, service, controller, routes, and API tests

**Files:**
- Modify: `server/tests/api.test.js` (append a describe block)
- Create: `server/src/models/Driver.js`
- Create: `server/src/services/driverService.js`
- Modify: `server/src/controllers/adminController.js`
- Modify: `server/src/routes/adminRoutes.js`

### Step 1: Write the failing driver API tests

Append the following describe block to the **end** of `server/tests/api.test.js` (after the existing "Analytics events" block). `ctx.adminAgent` is a valid admin agent at this point because the "Password management" block restored the password and re-assigned `ctx.adminAgent`.

```js
describe("Admin drivers", () => {
  let agent;
  let managerAgent;

  before(async () => {
    agent = ctx.adminAgent;
    managerAgent = request.agent(app);
    await managerAgent.post("/api/auth/manager/login").send({ email: "mgr@test.com", password: "Manager@123" });
  });

  it("blocks unauthenticated access", async () => {
    const res = await request(app).get("/api/admin/drivers");
    assert.strictEqual(res.status, 401);
  });

  it("blocks manager access", async () => {
    const res = await managerAgent.get("/api/admin/drivers");
    assert.strictEqual(res.status, 403);
  });

  it("creates a driver", async () => {
    const res = await agent.post("/api/admin/drivers").send({
      name: "Ahmed Mohamed",
      phone: "01000000001",
      vehicleType: "motorcycle",
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.driver.name, "Ahmed Mohamed");
    assert.strictEqual(res.body.data.driver.phone, "01000000001");
    assert.strictEqual(res.body.data.driver.vehicleType, "motorcycle");
    assert.strictEqual(res.body.data.driver.photo.url, "");
    ctx.driver = res.body.data.driver;
  });

  it("rejects an invalid vehicle type", async () => {
    const res = await agent.post("/api/admin/drivers").send({
      name: "Bad Type",
      phone: "01000000002",
      vehicleType: "helicopter",
    });
    assert.strictEqual(res.status, 400);
  });

  it("rejects a duplicate phone number", async () => {
    const res = await agent.post("/api/admin/drivers").send({
      name: "Another Ahmed",
      phone: "01000000001",
      vehicleType: "private_car",
    });
    assert.strictEqual(res.status, 409);
  });

  it("lists drivers with stats", async () => {
    const res = await agent.get("/api/admin/drivers");
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.drivers.map((d) => d.phone).includes("01000000001"));
    assert.strictEqual(res.body.data.stats.total, 1);
    assert.strictEqual(res.body.data.stats.motorcycle, 1);
  });

  it("filters drivers by vehicle type", async () => {
    await agent.post("/api/admin/drivers").send({
      name: "Omar Kareem",
      phone: "01000000003",
      vehicleType: "pickup_truck",
    });
    const res = await agent.get("/api/admin/drivers?vehicleType=motorcycle");
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.drivers.every((d) => d.vehicleType === "motorcycle"));
    assert.strictEqual(res.body.data.stats.pickup_truck, 1);
  });

  it("searches drivers by name", async () => {
    const res = await agent.get("/api/admin/drivers?search=Omar");
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.drivers.some((d) => d.name === "Omar Kareem"));
  });

  it("searches drivers by phone", async () => {
    const res = await agent.get("/api/admin/drivers?search=00000003");
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.drivers.some((d) => d.phone === "01000000003"));
  });

  it("gets a driver by id", async () => {
    const res = await agent.get(`/api/admin/drivers/${ctx.driver.id}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.driver.name, "Ahmed Mohamed");
  });

  it("rejects an invalid driver id", async () => {
    const res = await agent.get("/api/admin/drivers/not-an-id");
    assert.strictEqual(res.status, 400);
  });

  it("returns 404 for a missing driver", async () => {
    const res = await agent.get(`/api/admin/drivers/${new mongoose.Types.ObjectId()}`);
    assert.strictEqual(res.status, 404);
  });

  it("updates a driver", async () => {
    const res = await agent.patch(`/api/admin/drivers/${ctx.driver.id}`).send({
      name: "Ahmed Mohamed A.",
      phone: "01099999999",
      vehicleType: "tuk_tuk",
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.driver.name, "Ahmed Mohamed A.");
    assert.strictEqual(res.body.data.driver.phone, "01099999999");
    assert.strictEqual(res.body.data.driver.vehicleType, "tuk_tuk");
  });

  it("rejects updating to a duplicate phone", async () => {
    const res = await agent.patch(`/api/admin/drivers/${ctx.driver.id}`).send({ phone: "01000000003" });
    assert.strictEqual(res.status, 409);
  });

  it("deletes a driver", async () => {
    const res = await agent.delete(`/api/admin/drivers/${ctx.driver.id}`);
    assert.strictEqual(res.status, 200);
    const missing = await agent.get(`/api/admin/drivers/${ctx.driver.id}`);
    assert.strictEqual(missing.status, 404);
  });
});
```

### Step 2: Run the tests to verify the driver tests fail

Run: `npm test` (in `D:\dalil\server`)
Expected: The "Admin drivers" tests FAIL. `GET /api/admin/drivers` returns 404 (route does not exist yet) and creates return 404. Other suites pass. Record the failure output.

### Step 3: Create the Driver model

Create `server/src/models/Driver.js`:

```js
const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Driver name is required"], trim: true, maxlength: 80 },
    phone: { type: String, required: [true, "Mobile number is required"], unique: true, trim: true, maxlength: 20 },
    vehicleType: {
      type: String,
      enum: ["motorcycle", "tuk_tuk", "private_car", "pickup_truck"],
      required: [true, "Vehicle type is required"],
    },
    photo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

driverSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    phone: this.phone,
    vehicleType: this.vehicleType,
    photo: this.photo,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model("Driver", driverSchema);
```

### Step 4: Create the driver service

Create `server/src/services/driverService.js`:

```js
const Driver = require("../models/Driver");
const { AppError } = require("../middleware/errorHandler");
const cloudinaryService = require("./cloudinaryService");

async function listDrivers({ search = "", vehicleType = "", page = 1, limit = 10 }) {
  const query = {};

  if (vehicleType) query.vehicleType = vehicleType;

  if (search && String(search).trim()) {
    const term = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { name: { $regex: term, $options: "i" } },
      { phone: { $regex: term, $options: "i" } },
    ];
  }

  const [total, drivers, statsRows] = await Promise.all([
    Driver.countDocuments(query),
    Driver.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Driver.aggregate([{ $group: { _id: "$vehicleType", count: { $sum: 1 } } }]),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const stats = { total: 0, motorcycle: 0, tuk_tuk: 0, private_car: 0, pickup_truck: 0 };
  statsRows.forEach((r) => {
    stats.total += r.count;
    if (r._id) stats[r._id] = r.count;
  });

  return {
    drivers: drivers.map((d) => d.toPublicJSON()),
    pagination: { page: safePage, limit, total, totalPages },
    stats,
  };
}

async function getDriverById(id) {
  const driver = await Driver.findById(id);
  if (!driver) throw new AppError(404, "Driver not found.");
  return driver;
}

async function createDriver({ name, phone, vehicleType, photo }) {
  const dup = await Driver.findOne({ phone: String(phone).trim() });
  if (dup) throw new AppError(409, "A driver with this mobile number already exists.");

  const driver = await Driver.create({
    name: String(name).trim(),
    phone: String(phone).trim(),
    vehicleType,
    photo: photo || undefined,
  });
  return driver;
}

async function updateDriver(id, { name, phone, vehicleType, photo, removePhoto }) {
  const driver = await Driver.findById(id);
  if (!driver) throw new AppError(404, "Driver not found.");

  if (phone !== undefined) {
    const p = String(phone).trim();
    if (p !== driver.phone) {
      const dup = await Driver.findOne({ phone: p, _id: { $ne: id } });
      if (dup) throw new AppError(409, "A driver with this mobile number already exists.");
      driver.phone = p;
    }
  }
  if (name !== undefined) driver.name = String(name).trim();
  if (vehicleType !== undefined) driver.vehicleType = vehicleType;

  if (removePhoto) {
    if (driver.photo?.publicId) await cloudinaryService.deleteImage(driver.photo.publicId);
    driver.photo = { url: "", publicId: "" };
  } else if (photo) {
    if (driver.photo?.publicId) await cloudinaryService.deleteImage(driver.photo.publicId);
    driver.photo = photo;
  }

  await driver.save();
  return driver;
}

async function deleteDriver(id) {
  const driver = await Driver.findById(id);
  if (!driver) throw new AppError(404, "Driver not found.");
  if (driver.photo?.publicId) await cloudinaryService.deleteImage(driver.photo.publicId);
  await Driver.deleteOne({ _id: driver._id });
  return driver;
}

module.exports = { listDrivers, getDriverById, createDriver, updateDriver, deleteDriver };
```

### Step 5: Add driver handlers to the admin controller

Modify `server/src/controllers/adminController.js`:

1. Add the require at the top (line 5 area, after the other service requires):

```js
const driverService = require("../services/driverService");
```

2. Add a `// ---------- Drivers ----------` section before the `module.exports` block:

```js
// ---------- Drivers ----------

const listDrivers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 10), 100);
  const data = await driverService.listDrivers({
    search: req.query.search || "",
    vehicleType: req.query.vehicleType || "",
    page,
    limit,
  });
  res.json({ success: true, data });
});

const getDriver = asyncHandler(async (req, res) => {
  const driver = await driverService.getDriverById(req.params.id);
  res.json({ success: true, data: { driver: driver.toPublicJSON() } });
});

const createDriver = asyncHandler(async (req, res) => {
  let photo;
  if (req.file) {
    photo = await cloudinaryService.uploadImageBuffer(req.file.buffer, "dalil/drivers");
  }
  const driver = await driverService.createDriver({ ...req.body, photo });
  res.status(201).json({ success: true, data: { driver: driver.toPublicJSON(), message: "Driver created successfully." } });
});

const updateDriver = asyncHandler(async (req, res) => {
  let photo;
  if (req.file) {
    photo = await cloudinaryService.uploadImageBuffer(req.file.buffer, "dalil/drivers");
  }
  const removePhoto = req.body.removePhoto === true || req.body.removePhoto === "true";
  const driver = await driverService.updateDriver(req.params.id, { ...req.body, photo, removePhoto });
  res.json({ success: true, data: { driver: driver.toPublicJSON(), message: "Driver updated successfully." } });
});

const deleteDriver = asyncHandler(async (req, res) => {
  await driverService.deleteDriver(req.params.id);
  res.json({ success: true, data: { message: "Driver deleted successfully." } });
});
```

3. Add the five handlers to `module.exports` (anywhere in the exports object):

```js
  listDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
```

### Step 6: Add driver routes to the admin router

Modify `server/src/routes/adminRoutes.js`:

1. Add the multer require at the top (after the other requires):

```js
const { upload } = require("../middleware/uploadMiddleware");
```

2. Add a `// ---------- Drivers ----------` section before the Analytics section:

```js
// ---------- Drivers ----------

router.get("/drivers", adminController.listDrivers);

router.get("/drivers/:id", idParam, runValidation, adminController.getDriver);

router.post(
  "/drivers",
  upload.single("photo"),
  [
    body("name").trim().notEmpty().withMessage("Driver name is required.").isLength({ max: 80 }),
    body("phone")
      .trim()
      .notEmpty()
      .withMessage("Mobile number is required.")
      .isLength({ max: 20 })
      .matches(/^\+?[0-9][0-9\s-]{8,19}$/)
      .withMessage("Enter a valid mobile number."),
    body("vehicleType").isIn(["motorcycle", "tuk_tuk", "private_car", "pickup_truck"]).withMessage("Invalid vehicle type."),
  ],
  runValidation,
  adminController.createDriver
);

router.patch(
  "/drivers/:id",
  idParam,
  upload.single("photo"),
  [
    body("name").optional().trim().isLength({ max: 80 }),
    body("phone")
      .optional()
      .trim()
      .isLength({ max: 20 })
      .matches(/^\+?[0-9][0-9\s-]{8,19}$/)
      .withMessage("Enter a valid mobile number."),
    body("vehicleType").optional().isIn(["motorcycle", "tuk_tuk", "private_car", "pickup_truck"]).withMessage("Invalid vehicle type."),
    body("removePhoto").optional().isBoolean().withMessage("Invalid removePhoto value."),
  ],
  runValidation,
  adminController.updateDriver
);

router.delete("/drivers/:id", idParam, runValidation, adminController.deleteDriver);
```

### Step 7: Run the full test suite

Run: `npm test` (in `D:\dalil\server`)
Expected: ALL tests pass, including the 17 new "Admin drivers" tests. If any existing test broke, fix it before continuing.

### Step 8: Commit

```bash
git add server/src/models/Driver.js server/src/services/driverService.js server/src/controllers/adminController.js server/src/routes/adminRoutes.js server/tests/api.test.js
git commit -m "feat(server): add delivery drivers CRUD API"
```

---

## Task 2: Frontend — API service, constants, and i18n strings

**Files:**
- Modify: `client/src/services/adminService.js`
- Modify: `client/src/utils/constants.js`
- Modify: `client/src/i18n/locales/en.json`
- Modify: `client/src/i18n/locales/ar.json`

### Step 1: Add driver API functions to the admin service

Modify `client/src/services/adminService.js` — append this section at the end (after the Analytics section):

```js
// Drivers
export const adminGetDrivers = (params) => api.get("/admin/drivers", { params }).then((res) => res.data);
export const adminGetDriver = (id) => api.get(`/admin/drivers/${id}`).then((res) => res.data);
export const adminCreateDriver = (formData) => api.post("/admin/drivers", formData).then((res) => res.data);
export const adminUpdateDriver = (id, formData) => api.patch(`/admin/drivers/${id}`, formData).then((res) => res.data);
export const adminDeleteDriver = (id) => api.delete(`/admin/drivers/${id}`).then((res) => res.data);
```

Note: `adminCreateDriver`/`adminUpdateDriver` receive a `FormData` object (photo upload). Axios sets the multipart boundary automatically.

### Step 2: Add the vehicle type constant

Modify `client/src/utils/constants.js` — append at the end:

```js
export const VEHICLE_TYPES = [
  { value: "motorcycle", emoji: "🏍️" },
  { value: "tuk_tuk", emoji: "🛺" },
  { value: "private_car", emoji: "🚗" },
  { value: "pickup_truck", emoji: "🚚" },
];
```

### Step 3: Add English i18n keys

Modify `client/src/i18n/locales/en.json`:

1. Add `"adminDrivers": "Delivery Drivers — Dalil Admin",` to the `"meta"` object (after `"adminSettings"`).
2. Add `"drivers": "Drivers",` to the `"adminLayout"` object (after `"shops"`).
3. Add the following two top-level objects at the end of the file (after the `"managerSettings"` block, keeping valid JSON — comma after the closing brace of `"managerSettings"`):

```json
  "drivers": {
    "vehicleTypes": {
      "motorcycle": "Motorcycle",
      "tuk_tuk": "Tuk Tuk",
      "private_car": "Private Car",
      "pickup_truck": "Pickup / Small Transport Truck"
    }
  },
  "adminDrivers": {
    "searchPlaceholder": "Search drivers…",
    "allTypes": "All Drivers",
    "newDriver": "New Driver",
    "addDriver": "Add Driver",
    "editDriver": "Edit Driver",
    "noDriversTitle": "No drivers found",
    "noDriversSubtitle": "Add your first delivery driver to get started.",
    "nameRequired": "Driver name is required.",
    "phoneRequired": "Mobile number is required.",
    "vehicleTypeRequired": "Please select a vehicle type.",
    "updated": "Driver updated successfully.",
    "created": "Driver created successfully.",
    "deleted": "Driver deleted successfully.",
    "failedToLoad": "Failed to load drivers.",
    "failedToSave": "Failed to save driver.",
    "failedDelete": "Failed to delete driver.",
    "photo": "Driver photo",
    "photoHint": "Optional. JPG, PNG or WEBP — max 5MB.",
    "choosePhoto": "Choose photo",
    "removePhoto": "Remove photo",
    "photoInvalidType": "Only JPG, PNG or WEBP images are allowed.",
    "photoTooLarge": "Photo is too large. Maximum size is 5MB.",
    "name": "Driver name *",
    "namePlaceholder": "e.g. Ahmed Mohamed",
    "phone": "Mobile number *",
    "phonePlaceholder": "010XXXXXXXX",
    "vehicleType": "Vehicle type *",
    "selectVehicleType": "Select vehicle type…",
    "colDriver": "Driver",
    "colPhone": "Mobile Number",
    "colVehicle": "Vehicle Type",
    "colCreated": "Created",
    "colActions": "Actions",
    "deleteTitle": "Delete driver?",
    "deleteMessage": "Are you sure you want to delete \"{{name}}\"? This cannot be undone.",
    "deleteConfirm": "Delete driver"
  }
```

### Step 4: Add Arabic i18n keys

Modify `client/src/i18n/locales/ar.json`:

1. Add `"adminDrivers": "سائقو التوصيل — دليل الإدارة",` to the `"meta"` object (after `"adminSettings"`).
2. Add `"drivers": "السائقون",` to the `"adminLayout"` object (after `"shops"`).
3. Add the following two top-level objects at the end of the file (after the `"managerSettings"` block):

```json
  "drivers": {
    "vehicleTypes": {
      "motorcycle": "موتوسيكل",
      "tuk_tuk": "توك توك",
      "private_car": "سيارة خاصة",
      "pickup_truck": "بيك أب / سيارة نقل صغيرة"
    }
  },
  "adminDrivers": {
    "searchPlaceholder": "ابحث في السائقين…",
    "allTypes": "كل السائقين",
    "newDriver": "سائق جديد",
    "addDriver": "إضافة سائق",
    "editDriver": "تعديل السائق",
    "noDriversTitle": "لا يوجد سائقون",
    "noDriversSubtitle": "أضف أول سائق توصيل للبدء.",
    "nameRequired": "اسم السائق مطلوب.",
    "phoneRequired": "رقم الجوال مطلوب.",
    "vehicleTypeRequired": "يرجى اختيار نوع المركبة.",
    "updated": "تم تحديث السائق بنجاح.",
    "created": "تم إنشاء السائق بنجاح.",
    "deleted": "تم حذف السائق بنجاح.",
    "failedToLoad": "تعذر تحميل السائقين.",
    "failedToSave": "تعذر حفظ السائق.",
    "failedDelete": "تعذر حذف السائق.",
    "photo": "صورة السائق",
    "photoHint": "اختيارية. JPG أو PNG أو WEBP — بحد أقصى 5 ميجابايت.",
    "choosePhoto": "اختيار صورة",
    "removePhoto": "إزالة الصورة",
    "photoInvalidType": "يُسمح فقط بصور JPG أو PNG أو WEBP.",
    "photoTooLarge": "الصورة كبيرة جدًا. الحد الأقصى 5 ميجابايت.",
    "name": "اسم السائق *",
    "namePlaceholder": "مثال: أحمد محمد",
    "phone": "رقم الجوال *",
    "phonePlaceholder": "010XXXXXXXX",
    "vehicleType": "نوع المركبة *",
    "selectVehicleType": "اختر نوع المركبة…",
    "colDriver": "السائق",
    "colPhone": "رقم الجوال",
    "colVehicle": "نوع المركبة",
    "colCreated": "تاريخ الإنشاء",
    "colActions": "إجراءات",
    "deleteTitle": "حذف السائق؟",
    "deleteMessage": "هل أنت متأكد من رغبتك في حذف «{{name}}»؟ لا يمكن التراجع عن ذلك.",
    "deleteConfirm": "حذف السائق"
  }
```

### Step 5: Verify both JSON files are valid

Run (in `D:\dalil`):

```powershell
node -e "JSON.parse(require('fs').readFileSync('client/src/i18n/locales/en.json','utf8')); console.log('en ok')"
node -e "JSON.parse(require('fs').readFileSync('client/src/i18n/locales/ar.json','utf8')); console.log('ar ok')"
```

Expected: `en ok` and `ar ok` printed.

### Step 6: Commit

```bash
git add client/src/services/adminService.js client/src/utils/constants.js client/src/i18n/locales/en.json client/src/i18n/locales/ar.json
git commit -m "feat(client): add drivers API service, constants, and i18n strings"
```

---

## Task 3: Frontend — AdminDrivers page

**Files:**
- Create: `client/src/pages/admin/AdminDrivers.jsx`

### Step 1: Create the page

Create `client/src/pages/admin/AdminDrivers.jsx`:

```jsx
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Edit3, Trash2, User, Camera, X, Users } from "lucide-react";
import {
  adminGetDrivers,
  adminCreateDriver,
  adminUpdateDriver,
  adminDeleteDriver,
} from "../../services/adminService";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Spinner from "../../components/common/Spinner";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import { SkeletonTable } from "../../components/common/SkeletonCard";
import { usePageMeta } from "../../hooks/usePageMeta";
import { formatDate } from "../../utils/formatters";
import { useTranslation } from "react-i18next";
import { VEHICLE_TYPES } from "../../utils/constants";

const emptyForm = () => ({
  name: "",
  phone: "",
  vehicleType: "",
  photoFile: null,
  photoPreview: "",
  removePhoto: false,
});

export default function AdminDrivers() {
  const { t } = useTranslation();
  usePageMeta(t("meta.adminDrivers"), "");
  const [rows, setRows] = useState(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setRows(null);
    adminGetDrivers({ search, vehicleType, page, limit: 10 })
      .then((res) => setRows(res.data))
      .catch((err) => toast.error(err.safeMessage || t("adminDrivers.failedToLoad")));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, vehicleType, page]);

  const selectTab = (value) => {
    setVehicleType(value);
    setPage(1);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (driver) => {
    setEditing(driver);
    setForm({
      name: driver.name,
      phone: driver.phone,
      vehicleType: driver.vehicleType,
      photoFile: null,
      photoPreview: driver.photo?.url || "",
      removePhoto: false,
    });
    setModalOpen(true);
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handlePhotoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error(t("adminDrivers.photoInvalidType"));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("adminDrivers.photoTooLarge"));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setForm({
      ...form,
      photoFile: file,
      photoPreview: URL.createObjectURL(file),
      removePhoto: false,
    });
  };

  const removePhoto = () => {
    setForm({ ...form, photoFile: null, photoPreview: "", removePhoto: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.warning(t("adminDrivers.nameRequired"));
    if (!form.phone.trim()) return toast.warning(t("adminDrivers.phoneRequired"));
    if (!form.vehicleType) return toast.warning(t("adminDrivers.vehicleTypeRequired"));

    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("phone", form.phone.trim());
    formData.append("vehicleType", form.vehicleType);
    if (form.photoFile) formData.append("photo", form.photoFile);
    if (editing && form.removePhoto) formData.append("removePhoto", "true");

    setSaving(true);
    try {
      if (editing) {
        await adminUpdateDriver(editing.id, formData);
        toast.success(t("adminDrivers.updated"));
      } else {
        await adminCreateDriver(formData);
        toast.success(t("adminDrivers.created"));
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.safeMessage || t("adminDrivers.failedToSave"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await adminDeleteDriver(deleteTarget.id);
      toast.success(t("adminDrivers.deleted"));
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.safeMessage || t("adminDrivers.failedDelete"));
    } finally {
      setDeleting(false);
    }
  };

  const pagination = rows?.pagination;
  const stats = rows?.stats;

  const tabs = [
    { value: "", label: t("adminDrivers.allTypes"), emoji: "", count: stats?.total },
    ...VEHICLE_TYPES.map((v) => ({ ...v, label: t(`drivers.vehicleTypes.${v.value}`), count: stats?.[v.value] })),
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {tabs.map((tab) => (
          <button
            key={tab.value || "all"}
            type="button"
            onClick={() => selectTab(tab.value)}
            className={`card flex items-center gap-3 p-4 text-left transition ${
              vehicleType === tab.value ? "ring-2 ring-brand-500" : "hover:ring-1 hover:ring-slate-300"
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl dark:bg-slate-800">
              {tab.emoji ? tab.emoji : <Users className="h-5 w-5 text-slate-500" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{tab.label}</span>
              <span className="block text-xs font-bold text-brand-600 dark:text-brand-400">{tab.count ?? "…"}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (setSearch(query), setPage(1))}
              placeholder={t("adminDrivers.searchPlaceholder")}
              className="input !pl-10"
            />
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" /> {t("adminDrivers.newDriver")}
        </button>
      </div>

      {!rows ? (
        <SkeletonTable rows={6} cols={5} />
      ) : rows.drivers.length === 0 ? (
        <EmptyState
          title={t("adminDrivers.noDriversTitle")}
          subtitle={t("adminDrivers.noDriversSubtitle")}
          actionLabel={t("adminDrivers.newDriver")}
          onAction={openCreate}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">{t("adminDrivers.colDriver")}</th>
                <th className="px-4 py-3">{t("adminDrivers.colPhone")}</th>
                <th className="px-4 py-3">{t("adminDrivers.colVehicle")}</th>
                <th className="px-4 py-3">{t("adminDrivers.colCreated")}</th>
                <th className="px-4 py-3 text-right">{t("adminDrivers.colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.drivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100">
                        {driver.photo?.url ? (
                          <img src={driver.photo.url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <User className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <span className="font-semibold text-slate-800">{driver.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500" dir="ltr">
                    {driver.phone}
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/30">
                      {t(`drivers.vehicleTypes.${driver.vehicleType}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(driver.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(driver)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
                        title={t("common.edit")}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(driver)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                        title={t("common.delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && (
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={(p) => setPage(p)} />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t("adminDrivers.editDriver") : t("adminDrivers.addDriver")}
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="label">{t("adminDrivers.photo")}</label>
            <div className="flex flex-wrap items-center gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-slate-100">
                {form.photoPreview ? (
                  <img src={form.photoPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <User className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="btn-secondary cursor-pointer">
                  <Camera className="h-4 w-4" />
                  {t("adminDrivers.choosePhoto")}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoFile}
                  />
                </label>
                {(form.photoPreview || editing) && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                  >
                    <X className="h-3.5 w-3.5" /> {t("adminDrivers.removePhoto")}
                  </button>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">{t("adminDrivers.photoHint")}</p>
          </div>

          <div>
            <label className="label">{t("adminDrivers.name")}</label>
            <input
              value={form.name}
              onChange={set("name")}
              className="input"
              placeholder={t("adminDrivers.namePlaceholder")}
              required
            />
          </div>

          <div>
            <label className="label">{t("adminDrivers.phone")}</label>
            <input
              value={form.phone}
              onChange={set("phone")}
              className="input"
              dir="ltr"
              placeholder={t("adminDrivers.phonePlaceholder")}
              required
              inputMode="tel"
            />
          </div>

          <div>
            <label className="label">{t("adminDrivers.vehicleType")}</label>
            <select value={form.vehicleType} onChange={set("vehicleType")} className="input" required>
              <option value="">{t("adminDrivers.selectVehicleType")}</option>
              {VEHICLE_TYPES.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.emoji} {t(`drivers.vehicleTypes.${v.value}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              {t("common.cancel")}
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving && <Spinner size="sm" />}
              {editing ? t("common.saveChanges") : t("adminDrivers.addDriver")}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title={t("adminDrivers.deleteTitle")}
        message={t("adminDrivers.deleteMessage", { name: deleteTarget?.name })}
        confirmLabel={t("adminDrivers.deleteConfirm")}
      />
    </div>
  );
}
```

### Step 2: Verify the client builds

Run: `npm run build` (in `D:\dalil\client`)
Expected: Build succeeds with no errors.

### Step 3: Commit

```bash
git add client/src/pages/admin/AdminDrivers.jsx
git commit -m "feat(client): add delivery drivers admin page"
```

---

## Task 4: Frontend — navigation, routes, and admin layout title

**Files:**
- Modify: `client/src/layouts/AdminLayout.jsx`
- Modify: `client/src/routes/AppRoutes.jsx`

### Step 1: Add the Drivers nav item and header title

Modify `client/src/layouts/AdminLayout.jsx`:

1. Add `Truck` to the lucide-react import block:

```jsx
import {
  LayoutDashboard,
  Store,
  Truck,
  Users,
  FolderTree,
  BarChart3,
  Settings,
} from "lucide-react";
```

2. Add the nav item after the Shops item in `navItems`:

```jsx
    { to: "/admin/drivers", label: t("adminLayout.drivers"), icon: Truck },
```

3. Add the title in the `titles` object:

```jsx
    "/admin/drivers": t("adminLayout.drivers"),
```

### Step 2: Add the route

Modify `client/src/routes/AppRoutes.jsx`:

1. Add the import with the other admin page imports:

```jsx
import AdminDrivers from "../pages/admin/AdminDrivers";
```

2. Add the route after the `shops` route inside the admin layout Route:

```jsx
        <Route path="drivers" element={<AdminDrivers />} />
```

### Step 3: Verify the client builds

Run: `npm run build` (in `D:\dalil\client`)
Expected: Build succeeds with no errors.

### Step 4: Commit

```bash
git add client/src/layouts/AdminLayout.jsx client/src/routes/AppRoutes.jsx
git commit -m "feat(client): add drivers page to admin navigation and routes"
```

---

## Task 5: End-to-end verification

**Files:** none (verification only)

### Step 1: Run the backend test suite

Run: `npm test` (in `D:\dalil\server`)
Expected: All tests pass (public API, auth, admin panel, manager dashboard, password management, analytics, and the 17 new Admin drivers tests).

### Step 2: Run the client build

Run: `npm run build` (in `D:\dalil\client`)
Expected: Build succeeds with no errors.

### Step 3: Manual smoke test checklist (requires MongoDB + both servers running + admin login)

1. Log in at `/admin/login` with the admin account.
2. Open `/admin/drivers`. Sidebar shows a new **Drivers** item; header title reads "Drivers".
3. The page shows the 4 vehicle-type cards with count 0 and an empty state.
4. Click **New Driver** → Add modal opens.
5. Add a driver with name, phone `01011112222`, vehicle type Motorcycle → toast "Driver created successfully." → row appears under Motorcycle (click the Motorcycle card).
6. Edit the driver: change name, phone, vehicle type to Tuk Tuk → toast → row reflects changes.
7. Re-open edit: existing photo stays when no new photo is chosen; select an image → preview shows → save. (If Cloudinary is unconfigured, a 503 toast is expected — matches existing upload behavior.)
8. Try adding a driver with a duplicate phone → toast with "already exists" error.
9. Search by name and by phone in the search box (press Enter) → correct subset.
10. Click delete on a driver → ConfirmDialog appears → confirm → driver disappears, empty state or reduced list shows.
11. Check the main dashboard, `/admin/shops`, `/admin/managers`, `/admin/categories`, and `/admin/analytics` still work (no regressions).

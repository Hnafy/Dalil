# Location Button — Auto-fill Current Coordinates

**Date:** 2026-08-08
**Status:** Approved
**Owner:** opencode session

## Problem

Managers and admins must manually type latitude/longitude when editing a shop's
location, which is error-prone. We want a button next to the Latitude/Longitude
fields that fills in the current coordinates automatically using the browser's
Geolocation API.

## Requirements

- Add a "Use current location" button beside the Latitude/Longitude fields.
- The button appears in **both** forms that contain these fields:
  - `client/src/pages/manager/ManagerShopEdit.jsx` (manager edits own shop)
  - `client/src/pages/admin/AdminShops.jsx` (admin create/edit shop)
- Clicking it requests the current position and fills **only** the two
  coordinate fields (latitude, longitude) rounded to 6 decimal places. It does
  NOT generate a Google Maps link.
- Errors (permission denied, unavailable, timeout, unsupported browser) surface
  as a toast via `err.code`.
- All labels/messages are localized (en + ar).

## Design

### New component: `client/src/components/common/LocationButton.jsx`

Small reusable button with a `MapPin` icon and a `Spinner` while locating.

Props:

```js
{ onLocate, className }
```

- `onLocate(coords)` — called with `{ latitude, longitude }` (rounded to 6 dp).
- `className` — optional, appended to the button classes.

Behavior:

- Guard: `if (!("geolocation" in navigator))` → toast `locationButton.unsupported`.
- Call `navigator.geolocation.getCurrentPosition(success, error, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })`.
- While pending: disable button + show small `Spinner` + label `locationButton.locating`.
- On success: `onLocate({ latitude: coords.latitude, longitude: coords.longitude })` rounded to 6 dp; toast success optional (skip; the fields visibly fill).
- On error: map `err.code` → `PERMISSION_DENIED` → `locationButton.permissionDenied`, `POSITION_UNAVAILABLE` → `locationButton.unavailable`, `TIMEOUT` → `locationButton.timeout`, else generic `locationButton.unavailable`.

Note: Geolocation requires a secure context (HTTPS) or `localhost`. Works in
dev on `localhost`; in production the site must be served over HTTPS.

### Form changes

**`ManagerShopEdit.jsx`** — in the "Location" card, replace the `grid gap-4 sm:grid-cols-2` of Latitude/Longitude with:

- Keep the two inputs as-is.
- Add a `LocationButton` that sets `form.latitude`/`form.longitude` via
  `set({ ... })` using a dedicated handler: `handleLocate({ latitude, longitude })` → `setForm({ ...form, latitude: String(latitude), longitude: String(longitude) })`.

Button sits in the row below the two fields (or beside them within the grid).

**`AdminShops.jsx`** — same treatment in its Location section (lines ~367–374).

### Locale keys (added under `locationButton` in both `en.json` and `ar.json`)

| Key | en | ar |
|---|---|---|
| `locationButton.label` | Use current location | تحديد الموقع الحالي |
| `locationButton.locating` | Getting location… | جارٍ تحديد الموقع… |
| `locationButton.permissionDenied` | Location permission was denied. | تم رفض إذن الوصول للموقع. |
| `locationButton.unavailable` | Unable to get your location. | تعذّر تحديد موقعك. |
| `locationButton.timeout` | Timed out getting your location. | انتهت مهلة تحديد الموقع. |
| `locationButton.unsupported` | Your browser does not support location. | متصفحك لا يدعم تحديد الموقع. |

## Out of scope

- Reverse-geocoding / auto-filling the address field.
- Auto-generating the Google Maps URL.
- Server-side changes.

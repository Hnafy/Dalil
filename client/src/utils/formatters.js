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

export function cleanPhone(phone) {
  return String(phone || "").replace(/[^+\d]/g, "");
}

export function telHref(phone) {
  const p = cleanPhone(phone);
  return p ? `tel:${p}` : null;
}

export function waHref(phone, text = "") {
  const p = cleanPhone(phone);
  if (!p) return null;
  const encoded = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${p}${encoded}`;
}

export function mapsHref(shop) {
  if (shop.googleMapsUrl) return shop.googleMapsUrl;
  if (typeof shop.latitude === "number" && typeof shop.longitude === "number") {
    return `https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`;
  }
  if (shop.address) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`;
  return null;
}

export function truncate(text, len = 120) {
  if (!text) return "";
  return text.length > len ? `${text.slice(0, len).trim()}…` : text;
}

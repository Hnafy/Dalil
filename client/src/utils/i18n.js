import i18n from "../i18n";

export function localize(obj, key) {
  if (!obj) return "";
  const isAr = i18n.language?.startsWith("ar");
  const arabic = obj[`${key}Ar`];
  if (isAr && arabic) return arabic;
  return obj[key] || "";
}

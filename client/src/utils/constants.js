import {
  Utensils,
  ShoppingCart,
  Shirt,
  Scissors,
  Pill,
  MonitorSmartphone,
  Wrench,
  Croissant,
  Sofa,
  GraduationCap,
  Dumbbell,
  PawPrint,
  Store,
} from "lucide-react";

export const DAYS = [
  { key: "saturday" },
  { key: "sunday" },
  { key: "monday" },
  { key: "tuesday" },
  { key: "wednesday" },
  { key: "thursday" },
  { key: "friday" },
];

export const CATEGORY_ICONS = {
  "restaurants-and-cafes": Utensils,
  "groceries-and-markets": ShoppingCart,
  "fashion-and-clothing": Shirt,
  "beauty-and-salons": Scissors,
  "pharmacies-and-health": Pill,
  electronics: MonitorSmartphone,
  "services-and-repair": Wrench,
  "bakery-and-sweets": Croissant,
  "home-and-furniture": Sofa,
  education: GraduationCap,
  "sports-and-fitness": Dumbbell,
  pets: PawPrint,
};

export function categoryIcon(slug, iconName) {
  const Icon = CATEGORY_ICONS[slug];
  if (Icon) return Icon;
  const safe = new Set(["Store", "ShoppingBag", "Heart"]);
  const name = iconName && safe.has(iconName) ? iconName : "Store";
  const fallback = { Store, ShoppingBag: Store, Heart: Store };
  return fallback[name] || Store;
}

export const CLICK_TYPES = {
  phone: "phone_click",
  whatsapp: "whatsapp_click",
  maps: "maps_click",
  website: "website_click",
  facebook: "facebook_click",
  instagram: "instagram_click",
  tiktok: "tiktok_click",
};

export const SITE_NAME = "Dalil";
export const AREA_NAME = "Abou Ghaleb";
export const TAGLINE = "Discover local shops and services in Abou Ghaleb";

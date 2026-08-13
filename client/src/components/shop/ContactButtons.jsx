import { useState } from "react";
import {
  Phone,
  MessageCircle,
  Globe,
  Facebook,
  Instagram,
  Music2,
  MapPin,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { recordClick } from "../../services/analyticsService";
import { ensureVisitorId } from "../../utils/visitor";
import { CLICK_TYPES } from "../../utils/constants";
import { telHref, waHref, mapsHref, cleanPhone } from "../../utils/formatters";
import { useTranslation } from "react-i18next";
import { localize } from "../../utils/i18n";

const base =
  "btn w-full justify-start !justify-start !px-3.5 border !ring-1";

function Action({ href, icon: Icon, label, color, external = true, onClick }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      onClick={onClick}
      className={`${base} bg-surface text-slate-700 hover:bg-slate-50 ${color}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </a>
  );
}

export default function ContactButtons({ shop, compact = false }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const track = (type) => {
    ensureVisitorId().then((id) => recordClick(shop.id, id, type)).catch(() => {});
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/shops/${shop.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t("common.linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("common.couldNotCopy"));
    }
  };

  return (
    <div className="grid gap-2.5">
      <Action
        href={telHref(shop.phone)}
        icon={Phone}
        label={t("contact.call", { phone: cleanPhone(shop.phone) })}
        color="hover:!border-brand-200 hover:!text-brand-700 dark:hover:!border-brand-700 dark:hover:!text-brand-300"
        external={false}
        onClick={() => track(CLICK_TYPES.phone)}
      />
      <Action
        href={waHref(shop.whatsapp || shop.phone, t("contact.whatsappMessage", { name: localize(shop, "name") }))}
        icon={MessageCircle}
        label={t("contact.chatWhatsApp")}
        color="hover:!border-emerald-300 hover:!text-emerald-700 dark:hover:!border-emerald-700 dark:hover:!text-emerald-300"
        onClick={() => track(CLICK_TYPES.whatsapp)}
      />
      <Action
        href={mapsHref(shop)}
        icon={MapPin}
        label={t("contact.getDirections")}
        color="hover:!border-accent-400 hover:!text-accent-600 dark:hover:!border-accent-500 dark:hover:!text-accent-300"
        onClick={() => track(CLICK_TYPES.maps)}
      />
      <Action
        href={shop.socialLinks?.website}
        icon={Globe}
        label={t("contact.openWebsite")}
        color="hover:!border-slate-300"
        onClick={() => track(CLICK_TYPES.website)}
      />
      <div className={compact ? "grid grid-cols-3 gap-2.5" : "grid grid-cols-2 gap-2.5 sm:grid-cols-3"}>
        <Action
          href={shop.socialLinks?.facebook}
          icon={Facebook}
          label={t("contact.facebook")}
          color="hover:!border-blue-300 hover:!text-blue-600 dark:hover:!border-blue-700 dark:hover:!text-blue-300"
          onClick={() => track(CLICK_TYPES.facebook)}
        />
        <Action
          href={shop.socialLinks?.instagram}
          icon={Instagram}
          label={t("contact.instagram")}
          color="hover:!border-pink-300 hover:!text-pink-600 dark:hover:!border-pink-700 dark:hover:!text-pink-300"
          onClick={() => track(CLICK_TYPES.instagram)}
        />
        <Action
          href={shop.socialLinks?.tiktok}
          icon={Music2}
          label={t("contact.tiktok")}
          color="hover:!border-slate-400 hover:!text-slate-800"
          onClick={() => track(CLICK_TYPES.tiktok)}
        />
      </div>
      <button onClick={copyLink} className={`${base} border-slate-200 text-slate-600 hover:bg-slate-50`}>
        {copied ? <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-4 w-4" />}
        {copied ? t("contact.linkCopied") : t("contact.copyLink")}
      </button>
    </div>
  );
}

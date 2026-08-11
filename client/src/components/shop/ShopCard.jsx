import { Link } from "react-router-dom";
import { Phone, Eye, ArrowRight, Copy, Check, Star } from "lucide-react";
import { useState } from "react";
import StatusBadge from "../common/StatusBadge";
import { useShopStatus } from "../../hooks/useShopStatus";
import { formatViews, truncate } from "../../utils/formatters";
import { categoryIcon } from "../../utils/constants";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { localize } from "../../utils/i18n";

export default function ShopCard({ shop, featured = false }) {
  const { t } = useTranslation();
  const openStatus = useShopStatus(shop.workingHours);
  const [copied, setCopied] = useState(false);
  const image = shop.images?.[0]?.url;
  const Icon = categoryIcon(shop.category?.slug, shop.category?.icon);

  const copyLink = async (e) => {
    e.preventDefault();
    e.stopPropagation();
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
    <Link
      to={`/shops/${shop.slug}`}
      className="group card flex flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-200">
        {image ? (
          <img
            src={image}
            alt={localize(shop, "name")}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <Icon className="h-12 w-12" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <StatusBadge openStatus={openStatus} />
        </div>
        {featured && (
          <span className="absolute left-3 top-11 badge bg-accent-500 text-white shadow-card">
            <Star className="h-3.5 w-3.5 fill-current" /> {t("shopCard.featured")}
          </span>
        )}
        <button
          onClick={copyLink}
          aria-label={t("shopCard.copyLink")}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm backdrop-blur transition hover:text-brand-600"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-100 dark:bg-brand-950/40 dark:text-brand-300 dark:ring-brand-800">
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {localize(shop.category, "name") || t("shopCard.categoryFallback")}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
            <Eye className="h-3.5 w-3.5" />
            {formatViews(shop.views)}
          </span>
        </div>

        <h3 className="mt-2 text-lg font-bold text-slate-900 group-hover:text-brand-700 dark:group-hover:text-brand-400">
          {localize(shop, "name")}
        </h3>
        <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-500">
          {truncate(localize(shop, "description"), 110) || t("shopCard.descriptionFallback")}
        </p>

        {shop.phone && (
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-700">
            <Phone className="h-4 w-4 text-brand-600" />
            {shop.phone}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-sm font-semibold text-brand-600">{t("shopCard.viewDetails")}</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-950/40 dark:text-brand-300">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

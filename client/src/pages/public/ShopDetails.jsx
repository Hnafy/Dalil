import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, MapPin, Eye, ArrowLeft } from "lucide-react";
import { getShopBySlug } from "../../services/shopService";
import { recordView } from "../../services/analyticsService";
import { ensureVisitorId } from "../../utils/visitor";
import ShopGallery from "../../components/shop/ShopGallery";
import WorkingHoursTable from "../../components/shop/WorkingHoursTable";
import ContactButtons from "../../components/shop/ContactButtons";
import StatusBadge from "../../components/common/StatusBadge";
import Spinner from "../../components/common/Spinner";
import EmptyState from "../../components/common/EmptyState";
import { useShopStatus } from "../../hooks/useShopStatus";
import { usePageMeta } from "../../hooks/usePageMeta";
import { formatViews } from "../../utils/formatters";
import { useTranslation } from "react-i18next";
import { localize } from "../../utils/i18n";

export default function ShopDetails() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const [shop, setShop] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | error | ready

  usePageMeta(
    shop ? t("meta.shopTitle", { name: localize(shop, "name") }) : t("meta.shopFallbackTitle"),
    localize(shop, "description").slice(0, 160)
  );

  useEffect(() => {
    let active = true;
    setStatus("loading");
    getShopBySlug(slug)
      .then((res) => {
        if (!active) return;
        setShop(res.data);
        setStatus("ready");
        ensureVisitorId().then((id) => recordView(res.data.id, id)).catch(() => {});
      })
      .catch((err) => {
        if (!active) return;
        setStatus("error");
        setShop(null);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const openStatus = useShopStatus(shop?.workingHours);

  if (status === "loading") {
    return (
      <div className="container-page flex flex-col items-center justify-center py-32">
        <Spinner size="lg" />
        <p className="mt-4 text-sm font-medium text-slate-500">{t("shopDetails.loading")}</p>
      </div>
    );
  }

  if (status === "error" || !shop) {
    return (
      <div className="container-page py-24">
        <EmptyState
          title={t("shopDetails.notFoundTitle")}
          subtitle={t("shopDetails.notFoundSubtitle")}
          actionLabel={t("shopDetails.browseAll")}
          onAction={() => {
            window.location.href = "/shops";
          }}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-slate-400" aria-label={t("shopDetails.breadcrumb")}>
        <Link to="/" className="hover:text-brand-600">
          {t("shopDetails.home")}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link to="/shops" className="hover:text-brand-600">
          {t("shopDetails.shops")}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-slate-600">{localize(shop, "name")}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <ShopGallery images={shop.images} name={localize(shop, "name")} />

          <div className="mt-8">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Eye className="h-4 w-4" /> {t("shopDetails.views", { count: formatViews(shop.views) })}
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">{localize(shop, "name")}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StatusBadge openStatus={openStatus} />
              {shop.category && (
                <Link
                  to={`/categories/${shop.category.slug}`}
                  className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-100 hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-300 dark:ring-brand-800 dark:hover:bg-brand-900/60"
                >
                  {localize(shop.category, "name")}
                </Link>
              )}
            </div>
            <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-slate-600">
              {localize(shop, "description") || t("shopDetails.noDescription")}
            </p>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="card p-5">
            <h2 className="mb-4 text-lg font-bold text-slate-900">{t("shopDetails.getInTouch")}</h2>
            <ContactButtons shop={shop} />
          </div>

          <div className="card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
              <MapPin className="h-5 w-5 text-brand-600" /> {t("shopDetails.location")}
            </h2>
            {shop.address ? (
              <p className="text-sm text-slate-600">{shop.address}</p>
            ) : (
              <p className="text-sm text-slate-400">{t("shopDetails.noAddress")}</p>
            )}
          </div>
        </aside>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-xl font-bold text-slate-900">{t("shopDetails.workingHours")}</h2>
          <WorkingHoursTable workingHours={shop.workingHours} />
        </div>
      </div>

      <div className="mt-10">
        <Link to="/shops" className="btn-secondary">
          <ArrowLeft className="h-4 w-4" /> {t("shopDetails.backToAll")}
        </Link>
      </div>
    </div>
  );
}

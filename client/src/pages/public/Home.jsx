import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight, Store, Clock3, ShieldCheck } from "lucide-react";
import { getCategories, getShops } from "../../services/shopService";
import ShopCard from "../../components/shop/ShopCard";
import SectionHeading from "../../components/common/SectionHeading";
import { SkeletonGrid } from "../../components/common/SkeletonCard";
import EmptyState from "../../components/common/EmptyState";
import { usePageMeta } from "../../hooks/usePageMeta";
import { categoryIcon, AREA_NAME, VEHICLE_TYPES } from "../../utils/constants";
import { useTranslation } from "react-i18next";
import { localize } from "../../utils/i18n";
import Hero_img from '../../img/hero img.png'

export default function Home() {
  const { t } = useTranslation();
  usePageMeta(t("meta.homeTitle"), t("brand.tagline"));
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState(null);
  const [popular, setPopular] = useState(null);
  const [latest, setLatest] = useState(null);

  useEffect(() => {
    let active = true;
    getCategories()
      .then((res) => active && setCategories(res.data.categories || []))
      .catch(() => active && setCategories([]));
    getShops({ sort: "views", limit: 6 })
      .then((res) => active && setPopular(res.data.shops || []))
      .catch(() => active && setPopular([]));
    getShops({ sort: "latest", limit: 6 })
      .then((res) => active && setLatest(res.data.shops || []))
      .catch(() => active && setLatest([]));
    return () => {
      active = false;
    };
  }, []);

  const loading = categories === null || popular === null || latest === null;

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/shops?search=${encodeURIComponent(query.trim())}` : "/shops");
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_75%_80%,rgba(0,220,210,0.25),transparent_45%),radial-gradient(circle_at_20%_20%,rgba(0,120,120,0.2),transparent_40%),linear-gradient(135deg,#043638_0%,#075153_50%,#087f7d_100%)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="container-page relative py-20 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Text column */}
            <div className="text-center lg:text-right">
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                {t("home.heroTitle")}
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-lg text-brand-100 lg:mx-0">
                {t("home.heroSubtitle", { area: AREA_NAME })}
              </p>

              <form onSubmit={submitSearch} className="mx-auto mt-8 max-w-xl lg:mx-0">
                <div className="flex items-center gap-2 rounded-full bg-white p-2 shadow-lift">
                  <Search className="ml-3 h-5 w-5 shrink-0 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("home.searchPlaceholder")}
                    className="w-full bg-transparent py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none dark:text-slate-200 dark:placeholder-slate-600"
                    aria-label={t("home.searchLabel")}
                  />
                  <button type="submit" className="btn-primary shrink-0 !rounded-full">
                    {t("home.searchButton")}
                  </button>
                </div>
              </form>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-brand-100 lg:justify-start">
                <ShieldCheck className="h-4 w-4 text-brand-200" />
                <span>موثوق</span>
                <span className="text-brand-300">•</span>
                <span>سريع</span>
                <span className="text-brand-300">•</span>
                <span>قريب منك</span>
              </div>
            </div>

            {/* Illustration column - desktop only */}
            <div className="hidden lg:block">
              <img
                src={Hero_img}
                alt={t("brand.tagline")}
                className="mx-auto w-full max-w-xl select-none drop-shadow-2xl"
              />
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm text-brand-100">
            <span className="inline-flex items-center gap-1.5">
              <Store className="h-4 w-4" /> {t("home.browseByCategory")}
            </span>
            <span className="hidden text-brand-200 sm:inline">•</span>
            <Link
              to="/shops?openNow=true"
              className="inline-flex items-center gap-1.5 font-semibold text-white underline-offset-4 hover:underline"
            >
              <Clock3 className="h-4 w-4" /> {t("home.seeOpenNow")}
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-16">
        <SectionHeading
          eyebrow={t("home.categoriesEyebrow")}
          title={t("home.categoriesTitle")}
          subtitle={t("home.categoriesSubtitle", { area: AREA_NAME })}
          action={
            <Link to="/shops" className="btn-secondary">
              {t("home.viewAllShops")} <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        {loading ? (
          <SkeletonGrid count={6} />
        ) : categories.length === 0 ? (
          <EmptyState title={t("home.noCategoriesTitle")} subtitle={t("home.noCategoriesSubtitle")} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {categories.map((c) => {
              const Icon = categoryIcon(c.slug, c.icon);
              return (
                <Link
                  key={c.id}
                  to={`/categories/${c.slug}`}
                  className="group card flex flex-col items-center gap-3 p-6 text-center transition hover:-translate-y-1 hover:shadow-lift"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-950/40 dark:text-brand-300">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{localize(c, "name")}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{t("home.shopCount", { count: c.shopCount })}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Popular */}
      <section className="border-y border-slate-200 bg-surface py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow={t("home.popularEyebrow")}
            title={t("home.popularTitle")}
            subtitle={t("home.popularSubtitle", { area: AREA_NAME })}
          />
          {loading ? (
            <SkeletonGrid count={3} />
          ) : popular.length === 0 ? (
            <EmptyState title={t("home.noPopularTitle")} subtitle={t("home.noPopularSubtitle")} />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {popular.map((shop, i) => (
                <ShopCard key={shop.id} shop={shop} featured={i === 0} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Latest */}
      <section className="container-page py-16">
        <SectionHeading
          eyebrow={t("home.latestEyebrow")}
          title={t("home.latestTitle")}
          subtitle={t("home.latestSubtitle", { area: AREA_NAME })}
        />
        {loading ? (
          <SkeletonGrid count={3} />
        ) : latest.length === 0 ? (
          <EmptyState title={t("home.noLatestTitle")} subtitle={t("home.noLatestSubtitle")} />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}
      </section>

      {/* Drivers */}
      <section className="border-y border-slate-200 bg-surface py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow={t("home.driversEyebrow")}
            title={t("home.driversTitle")}
            subtitle={t("home.driversSubtitle", { area: AREA_NAME })}
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {VEHICLE_TYPES.map((v) => (
              <Link
                key={v.value}
                to={`/drivers?vehicleType=${v.value}`}
                className="group card flex flex-col items-center gap-3 p-6 text-center transition hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-xl transition group-hover:bg-brand-600 dark:bg-brand-950/40">
                  {v.emoji}
                </span>
                <span className="text-sm font-bold text-slate-800">{t(`drivers.vehicleTypes.${v.value}`)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-14 text-center sm:px-12">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle at 70% 30%, white 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <h2 className="relative text-3xl font-extrabold text-white">
            {t("home.ownShopTitle", { area: AREA_NAME })}
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-brand-100">
            {t("home.ownShopText")}
          </p>
          <div className="relative mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/shops" className="btn bg-white text-brand-700 hover:bg-brand-50">
              {t("home.exploreDirectory")} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/admin/login"
              className="btn bg-white/10 text-white ring-1 ring-white/30 hover:bg-white/20"
            >
              {t("home.administratorAccess")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
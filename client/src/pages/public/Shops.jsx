import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchX, Store } from "lucide-react";
import { getShops, getCategories } from "../../services/shopService";
import ShopCard from "../../components/shop/ShopCard";
import ShopFilters from "../../components/shop/ShopFilters";
import Pagination from "../../components/common/Pagination";
import EmptyState from "../../components/common/EmptyState";
import { SkeletonGrid } from "../../components/common/SkeletonCard";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useTranslation } from "react-i18next";

export default function Shops() {
  const { t } = useTranslation();
  usePageMeta(t("meta.shopsTitle"), t("meta.shopsDescription"));
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const openNow = searchParams.get("openNow") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    getShops({ search, category, openNow, page, limit: 9 })
      .then((res) => active && setData(res.data))
      .catch((err) => {
        if (active) {
          setData({ shops: [], pagination: { page: 1, total: 0, totalPages: 1 } });
          setError(err.safeMessage || t("shops.failedToLoad"));
        }
      });
    return () => {
      active = false;
    };
  }, [search, category, openNow, page]);

  const applyFilters = (filters) => {
    const next = {};
    if (filters.search) next.search = filters.search;
    if (filters.category) next.category = filters.category;
    if (filters.openNow) next.openNow = "true";
    setSearchParams(next);
  };

  const changePage = (p) => {
    const next = { search, category };
    if (openNow) next.openNow = "true";
    if (p > 1) next.page = String(p);
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalShown = data?.shops.length ?? 0;

  return (
    <div className="container-page py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">{t("shops.title")}</h1>
        <p className="mt-2 text-slate-500">
          {data && !error
            ? t("shops.count", { count: data.pagination.total })
            : t("shops.fallback")}
        </p>
      </header>

      <ShopFilters categories={categories} onApply={applyFilters} initial={{ search, category, openNow }} />

      <div className="mt-8">
        {!data ? (
          <SkeletonGrid count={6} />
        ) : error ? (
          <EmptyState title={t("shops.errorTitle")} subtitle={error} />
        ) : totalShown === 0 ? (
          <EmptyState
            icon={SearchX}
            title={t("shops.noMatchTitle")}
            subtitle={t("shops.noMatchSubtitle")}
            actionLabel={t("shops.resetFilters")}
            onAction={() => setSearchParams({})}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.shops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>
            <Pagination page={page} totalPages={data.pagination.totalPages} onChange={changePage} />
          </>
        )}
      </div>
    </div>
  );
}

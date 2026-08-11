import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SearchX } from "lucide-react";
import { getShops, getCategories } from "../../services/shopService";
import ShopCard from "../../components/shop/ShopCard";
import Pagination from "../../components/common/Pagination";
import EmptyState from "../../components/common/EmptyState";
import { SkeletonGrid } from "../../components/common/SkeletonCard";
import { usePageMeta } from "../../hooks/usePageMeta";
import { categoryIcon } from "../../utils/constants";
import { useTranslation } from "react-i18next";
import { localize } from "../../utils/i18n";

export default function CategoryShops() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);

  usePageMeta(
    category ? t("meta.categoryTitle", { name: localize(category, "name") }) : t("meta.categoryFallbackTitle"),
    localize(category, "description")
  );

  useEffect(() => {
    let active = true;
    getCategories()
      .then((res) => {
        const found = (res.data.categories || []).find((c) => c.slug === slug);
        if (active) setCategory(found || null);
      })
      .catch(() => active && setCategory(null));
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    let active = true;
    setData(null);
    getShops({ category: slug, page, limit: 9 })
      .then((res) => active && setData(res.data))
      .catch(() => active && setData({ shops: [], pagination: { page: 1, total: 0, totalPages: 1 } }));
    return () => {
      active = false;
    };
  }, [slug, page]);

  const Icon = category ? categoryIcon(category.slug, category.icon) : null;

  if (!category && data === null) {
    return (
      <div className="container-page py-16">
        <SkeletonGrid count={6} />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container-page py-24">
        <EmptyState
          icon={SearchX}
          title={t("categoryShops.notFoundTitle")}
          subtitle={t("categoryShops.notFoundSubtitle")}
          actionLabel={t("categoryShops.browseAll")}
          onAction={() => {
            window.location.href = "/shops";
          }}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <header className="mb-8 flex items-center gap-4">
        {Icon && (
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
            <Icon className="h-7 w-7" />
          </span>
        )}
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">{localize(category, "name")}</h1>
          <p className="mt-1 text-slate-500">
            {localize(category, "description") || t("categoryShops.defaultDescription", { name: localize(category, "name") })}
          </p>
        </div>
      </header>

      {!data ? (
        <SkeletonGrid count={6} />
      ) : data.shops.length === 0 ? (
        <EmptyState
          title={t("categoryShops.noShopsTitle")}
          subtitle={t("categoryShops.noShopsSubtitle")}
          actionLabel={t("categoryShops.browseAll")}
          onAction={() => {
            window.location.href = "/shops";
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
          <Pagination page={page} totalPages={data.pagination.totalPages} onChange={(p) => setPage(p)} />
        </>
      )}

      <div className="mt-10">
        <Link to="/shops" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          {t("categoryShops.backToAll")}
        </Link>
      </div>
    </div>
  );
}

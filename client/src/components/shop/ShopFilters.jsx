import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, X, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { localize } from "../../utils/i18n";

export default function ShopFilters({ categories, onApply, initial = {} }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState(initial.search || "");
  const [category, setCategory] = useState(initial.category || "");
  const [openNow, setOpenNow] = useState(initial.openNow === true || initial.openNow === "true");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setSearch(initial.search || "");
    setCategory(initial.category || "");
    setOpenNow(initial.openNow === true || initial.openNow === "true");
  }, [initial]);

  const apply = (e) => {
    e?.preventDefault();
    onApply({ search, category, openNow });
  };

  const reset = () => {
    setSearch("");
    setCategory("");
    setOpenNow(false);
    onApply({ search: "", category: "", openNow: false });
  };

  const hasFilters = search || category || openNow;

  return (
    <form onSubmit={apply} className="card p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("shopFilters.searchPlaceholder")}
            className="input !pl-11"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="btn-secondary lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" /> {t("shopFilters.filters")}
        </button>

        <div className={`${showFilters ? "flex" : "hidden"} flex-col gap-3 sm:flex-row lg:flex`}>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input sm:w-56">
            <option value="">{t("shopFilters.allCategories")}</option>
            {(categories || []).map((c) => (
              <option key={c.id} value={c.slug}>
                {localize(c, "name")}
              </option>
            ))}
          </select>

          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-surface px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50">
            <input
              type="checkbox"
              checked={openNow}
              onChange={(e) => setOpenNow(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> {t("shopFilters.openNow")}
          </label>

          <button type="submit" className="btn-primary">
            <Search className="h-4 w-4" /> {t("common.search")}
          </button>

          {hasFilters && (
            <button type="button" onClick={reset} className="btn-ghost">
              <X className="h-4 w-4" /> {t("common.reset")}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

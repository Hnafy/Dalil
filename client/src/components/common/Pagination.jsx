import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Pagination({ page, totalPages, onChange }) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label={t("common.paginationLabel")}>
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="btn-secondary !px-3 !py-2 disabled:opacity-40"
        aria-label={t("pagination.previousPage")}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, idx) =>
        p === "…" ? (
          <span key={`e${idx}`} className="px-2 text-slate-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`h-9 w-9 rounded-xl text-sm font-semibold transition ${
              p === page
                ? "bg-brand-600 text-white"
                : "text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="btn-secondary !px-3 !py-2 disabled:opacity-40"
        aria-label={t("pagination.nextPage")}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

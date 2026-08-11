import { SearchX } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function EmptyState({
  icon: Icon = SearchX,
  title,
  subtitle,
  actionLabel,
  onAction,
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-surface/60 px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {subtitle && <p className="mt-1 max-w-md text-sm text-slate-500">{subtitle}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-secondary mt-5">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

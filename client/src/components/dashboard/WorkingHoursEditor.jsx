import { DAYS } from "../../utils/constants";
import { useTranslation } from "react-i18next";

const defaultSlot = { isOpen: true, open: "09:00", close: "18:00" };

export default function WorkingHoursEditor({ value, onChange }) {
  const { t } = useTranslation();
  const update = (key, patch) => {
    const current = value?.[key] || {};
    let next = { ...defaultSlot, ...current, ...patch };

    // When a day is turned "open", replace the seeded 00:00–00:00 (closed) sentinel
    // with sensible defaults so the open badge actually applies.
    if (next.isOpen && next.open === "00:00" && next.close === "00:00") {
      next.open = defaultSlot.open;
      next.close = defaultSlot.close;
    }

    // Never persist empty time strings (a cleared <input type="time"> yields "").
    if (next.isOpen) {
      if (!next.open) next.open = defaultSlot.open;
      if (!next.close) next.close = defaultSlot.close;
    } else {
      if (!next.open) next.open = "00:00";
      if (!next.close) next.close = "00:00";
    }

    onChange({ ...value, [key]: next });
  };

  return (
    <div className="space-y-2">
      {DAYS.map((d) => {
        const slot = { ...defaultSlot, ...(value?.[d.key] || {}) };
        return (
          <div
            key={d.key}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3"
          >
            <label className="flex w-32 items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={slot.isOpen}
                onChange={(e) => update(d.key, { isOpen: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              {t(`days.${d.key}`)}
            </label>
            <div className={`flex items-center gap-2 ${slot.isOpen ? "" : "pointer-events-none opacity-40"}`}>
              <input
                type="time"
                value={slot.open}
                onChange={(e) => update(d.key, { open: e.target.value })}
                className="input !w-32 !px-2.5 !py-1.5"
                aria-label={t("days.openingTime", { day: t(`days.${d.key}`) })}
              />
              <span className="text-slate-400">{t("days.to")}</span>
              <input
                type="time"
                value={slot.close}
                onChange={(e) => update(d.key, { close: e.target.value })}
                className="input !w-32 !px-2.5 !py-1.5"
                aria-label={t("days.closingTime", { day: t(`days.${d.key}`) })}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

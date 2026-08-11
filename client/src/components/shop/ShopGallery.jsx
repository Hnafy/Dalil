import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ShopGallery({ images, name }) {
  const { t } = useTranslation();
  const list = images || [];
  const [index, setIndex] = useState(0);
  const current = list[index];

  if (list.length === 0) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <ImageOff className="h-12 w-12" aria-label={t("shopGallery.noImages")} />
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-900 dark:bg-slate-100">
        <img
          src={current.url}
          alt={t("shopGallery.photoAlt", { name, number: index + 1 })}
          className="h-full w-full object-cover"
        />
        {list.length > 1 && (
          <>
            <button
              onClick={() => setIndex((index - 1 + list.length) % list.length)}
              aria-label={t("shopGallery.previousPhoto")}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow backdrop-blur transition hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIndex((index + 1) % list.length)}
              aria-label={t("shopGallery.nextPhoto")}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow backdrop-blur transition hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
              {index + 1} / {list.length}
            </span>
          </>
        )}
      </div>

      {list.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {list.map((img, i) => (
            <button
              key={`${img.publicId}-${i}`}
              onClick={() => setIndex(i)}
              aria-label={t("shopGallery.showPhoto", { number: i + 1 })}
              className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl ring-2 transition ${
                i === index ? "ring-brand-500" : "ring-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

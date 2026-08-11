import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Info, Save } from "lucide-react";
import { getMyShop, updateMyShop } from "../../services/managerService";
import Spinner from "../../components/common/Spinner";
import LocationButton from "../../components/common/LocationButton";
import SkeletonCard from "../../components/common/SkeletonCard";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useTranslation } from "react-i18next";

export default function ManagerShopEdit() {
  const { t } = useTranslation();
  usePageMeta(t("meta.managerShop"), "");
  const [shop, setShop] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getMyShop()
      .then((res) => {
        if (!active) return;
        const s = res.data;
        setShop(s);
        setForm({
          description: s.description || "",
          descriptionAr: s.descriptionAr || "",
          phone: s.phone || "",
          whatsapp: s.whatsapp || "",
          address: s.address || "",
          latitude: s.latitude ?? "",
          longitude: s.longitude ?? "",
          googleMapsUrl: s.googleMapsUrl || "",
          facebook: s.socialLinks?.facebook || "",
          instagram: s.socialLinks?.instagram || "",
          tiktok: s.socialLinks?.tiktok || "",
          website: s.socialLinks?.website || "",
        });
      })
      .catch((err) => toast.error(err.safeMessage || t("managerShopEdit.failedToLoad")));
    return () => {
      active = false;
    };
  }, [t]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMyShop({
        description: form.description,
        descriptionAr: form.descriptionAr,
        phone: form.phone,
        whatsapp: form.whatsapp,
        address: form.address,
        latitude: form.latitude === "" ? null : Number(form.latitude),
        longitude: form.longitude === "" ? null : Number(form.longitude),
        googleMapsUrl: form.googleMapsUrl,
        socialLinks: {
          facebook: form.facebook,
          instagram: form.instagram,
          tiktok: form.tiktok,
          website: form.website,
        },
      });
      toast.success(t("managerShopEdit.updated"));
    } catch (err) {
      toast.error(err.safeMessage || t("managerShopEdit.failedToUpdate"));
    } finally {
      setSaving(false);
    }
  };

  if (!shop || !form) {
    return (
      <div className="max-w-3xl">
        <SkeletonCard />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-3xl space-y-6">
      <div className="card flex items-start gap-4 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
          <Info className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-bold text-slate-900">{shop.name}</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {t("managerShopEdit.info")}
          </p>
        </div>
      </div>

      <div className="card space-y-5 p-6">
        <h2 className="text-lg font-bold text-slate-900">{t("managerShopEdit.contactDescription")}</h2>
        <div>
          <label className="label">{t("managerShopEdit.description")}</label>
          <textarea value={form.description} onChange={set("description")} rows={4} className="input" />
        </div>
        <div>
          <label className="label">{t("managerShopEdit.descriptionAr")}</label>
          <textarea value={form.descriptionAr} onChange={set("descriptionAr")} rows={4} className="input" dir="rtl" placeholder={t("managerShopEdit.descriptionArPlaceholder")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t("managerShopEdit.phone")}</label>
            <input value={form.phone} onChange={set("phone")} className="input" placeholder={t("managerShopEdit.phonePlaceholder")} />
          </div>
          <div>
            <label className="label">{t("managerShopEdit.whatsapp")}</label>
            <input value={form.whatsapp} onChange={set("whatsapp")} className="input" />
          </div>
        </div>
      </div>

      <div className="card space-y-5 p-6">
        <h2 className="text-lg font-bold text-slate-900">{t("managerShopEdit.location")}</h2>
        <div>
          <label className="label">{t("managerShopEdit.address")}</label>
          <input value={form.address} onChange={set("address")} className="input" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t("managerShopEdit.latitude")}</label>
            <input value={form.latitude} onChange={set("latitude")} className="input" type="number" step="any" />
          </div>
          <div>
            <label className="label">{t("managerShopEdit.longitude")}</label>
            <input value={form.longitude} onChange={set("longitude")} className="input" type="number" step="any" />
          </div>
        </div>
        <div>
          <LocationButton
            onLocate={({ latitude, longitude }) =>
              setForm({ ...form, latitude: String(latitude), longitude: String(longitude) })
            }
          />
        </div>
        <div>
          <label className="label">{t("managerShopEdit.googleMapsLink")}</label>
          <input value={form.googleMapsUrl} onChange={set("googleMapsUrl")} className="input" placeholder={t("managerShopEdit.googleMapsPlaceholder")} />
        </div>
      </div>

      <div className="card space-y-5 p-6">
        <h2 className="text-lg font-bold text-slate-900">{t("managerShopEdit.socialLinks")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t("managerShopEdit.facebook")}</label>
            <input value={form.facebook} onChange={set("facebook")} className="input" />
          </div>
          <div>
            <label className="label">{t("managerShopEdit.instagram")}</label>
            <input value={form.instagram} onChange={set("instagram")} className="input" />
          </div>
          <div>
            <label className="label">{t("managerShopEdit.tiktok")}</label>
            <input value={form.tiktok} onChange={set("tiktok")} className="input" />
          </div>
          <div>
            <label className="label">{t("managerShopEdit.website")}</label>
            <input value={form.website} onChange={set("website")} className="input" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
          {t("managerShopEdit.saveChanges")}
        </button>
      </div>
    </form>
  );
}

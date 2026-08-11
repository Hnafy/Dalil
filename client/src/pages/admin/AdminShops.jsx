import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Store,
  Clock,
} from "lucide-react";
import {
  adminGetShops,
  adminCreateShop,
  adminUpdateShop,
  adminDeleteShop,
  adminGetManagers,
} from "../../services/adminService";
import { getCategories } from "../../services/shopService";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Spinner from "../../components/common/Spinner";
import LocationButton from "../../components/common/LocationButton";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import { SkeletonTable } from "../../components/common/SkeletonCard";
import WorkingHoursEditor from "../../components/dashboard/WorkingHoursEditor";
import { usePageMeta } from "../../hooks/usePageMeta";
import { formatDate } from "../../utils/formatters";
import { useTranslation } from "react-i18next";
import { localize } from "../../utils/i18n";

const emptyForm = () => ({
  name: "",
  nameAr: "",
  category: "",
  description: "",
  descriptionAr: "",
  phone: "",
  whatsapp: "",
  address: "",
  latitude: "",
  longitude: "",
  googleMapsUrl: "",
  facebook: "",
  instagram: "",
  tiktok: "",
  website: "",
  managerId: "",
  status: "active",
  workingHours: null,
});

export default function AdminShops() {
  const { t } = useTranslation();
  usePageMeta(t("meta.adminShops"), "");
  const [rows, setRows] = useState(null);
  const [managers, setManagers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [showHours, setShowHours] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data.categories || []))
      .catch(() => setCategories([]));
    adminGetManagers()
      .then((res) => setManagers(res.data.managers || []))
      .catch(() => setManagers([]));
  }, []);

  const load = () => {
    setRows(null);
    adminGetShops({ search, status, page, limit: 10 })
      .then((res) => setRows(res.data))
      .catch((err) => toast.error(err.safeMessage || t("adminShops.failedToLoad")));
  };

  useEffect(() => {
    load();
  }, [search, status, page]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setShowHours(false);
    setModalOpen(true);
  };

  const openEdit = (shop) => {
    setEditing(shop);
    setForm({
      name: shop.name,
      nameAr: shop.nameAr || "",
      category: shop.category?._id || shop.category?.id || "",
      description: shop.description || "",
      descriptionAr: shop.descriptionAr || "",
      phone: shop.phone || "",
      whatsapp: shop.whatsapp || "",
      address: shop.address || "",
      latitude: shop.latitude ?? "",
      longitude: shop.longitude ?? "",
      googleMapsUrl: shop.googleMapsUrl || "",
      facebook: shop.socialLinks?.facebook || "",
      instagram: shop.socialLinks?.instagram || "",
      tiktok: shop.socialLinks?.tiktok || "",
      website: shop.socialLinks?.website || "",
      managerId: shop.manager?._id || shop.manager?.id || "",
      status: shop.status,
      workingHours: shop.workingHours || null,
    });
    setShowHours(false);
    setModalOpen(true);
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.warning(t("adminShops.nameRequired"));
    if (!form.category) return toast.warning(t("adminShops.categoryRequired"));

    const payload = {
      name: form.name.trim(),
      nameAr: form.nameAr,
      category: form.category,
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
      status: form.status,
      managerId: form.managerId || null,
      workingHours: form.workingHours || undefined,
    };

    setSaving(true);
    try {
      if (editing) {
        await adminUpdateShop(editing.id, payload);
        toast.success(t("adminShops.updated"));
      } else {
        await adminCreateShop(payload);
        toast.success(t("adminShops.created"));
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.safeMessage || t("adminShops.failedToSave"));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (shop) => {
    const next = shop.status === "active" ? "inactive" : "active";
    try {
      await adminUpdateShop(shop.id, { status: next });
      toast.warning(next === "inactive" ? t("adminShops.deactivated") : t("adminShops.activated"));
      load();
    } catch (err) {
      toast.error(err.safeMessage || t("adminShops.failedStatus"));
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await adminDeleteShop(deleteTarget.id);
      toast.success(t("adminShops.deleted"));
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.safeMessage || t("adminShops.failedDelete"));
    } finally {
      setDeleting(false);
    }
  };

  const pagination = rows?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (setSearch(query), setPage(1))}
              placeholder={t("adminShops.searchPlaceholder")}
              className="input !pl-10"
            />
          </div>
          <select value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))} className="input w-40">
            <option value="">{t("adminShops.allStatuses")}</option>
            <option value="active">{t("common.active")}</option>
            <option value="inactive">{t("common.inactive")}</option>
          </select>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" /> {t("adminShops.newShop")}
        </button>
      </div>

      {!rows ? (
        <SkeletonTable rows={6} cols={6} />
      ) : rows.shops.length === 0 ? (
        <EmptyState title={t("adminShops.noShopsTitle")} subtitle={t("adminShops.noShopsSubtitle")} actionLabel={t("adminShops.newShop")} onAction={openCreate} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">{t("adminShops.colShop")}</th>
                <th className="px-4 py-3">{t("adminShops.colCategory")}</th>
                <th className="px-4 py-3">{t("adminShops.colManager")}</th>
                <th className="px-4 py-3">{t("adminShops.colViews")}</th>
                <th className="px-4 py-3">{t("adminShops.colCreated")}</th>
                <th className="px-4 py-3">{t("adminShops.colStatus")}</th>
                <th className="px-4 py-3 text-right">{t("adminShops.colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.shops.map((shop) => (
                <tr key={shop.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {shop.images?.[0]?.url ? (
                          <img src={shop.images[0].url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <Store className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <span className="font-semibold text-slate-800">{shop.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{localize(shop.category, "name") || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{shop.manager?.name || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{shop.views}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(shop.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(shop)}
                      className={`badge ring-1 ${shop.status === "active" ? "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30 dark:hover:bg-emerald-500/20" : "bg-slate-100 text-slate-500 ring-slate-200 hover:bg-slate-200"}`}
                      title={t(shop.status === "active" ? "adminShops.deactivate" : "adminShops.activate")}
                    >
                      {shop.status === "active" ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      {shop.status}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(shop)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
                        title={t("common.edit")}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(shop)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                        title={t("common.delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && (
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={(p) => setPage(p)} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t("adminShops.editShop") : t("adminShops.createShop")} size="xl">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">{t("adminShops.shopName")}</label>
              <input value={form.name} onChange={set("name")} className="input" placeholder={t("adminShops.shopNamePlaceholder")} required />
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t("adminShops.shopNameAr")}</label>
              <input value={form.nameAr} onChange={set("nameAr")} className="input" placeholder={t("adminShops.shopNameArPlaceholder")} />
            </div>
            <div>
              <label className="label">{t("adminShops.category")}</label>
              <select value={form.category} onChange={set("category")} className="input" required>
                <option value="">{t("adminShops.selectCategory")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t("adminShops.status")}</label>
              <select value={form.status} onChange={set("status")} className="input">
                <option value="active">{t("common.active")}</option>
                <option value="inactive">{t("common.inactive")}</option>
              </select>
            </div>
            <div>
              <label className="label">{t("adminShops.managerOptional")}</label>
              <select value={form.managerId} onChange={set("managerId")} className="input">
                <option value="">{t("adminShops.none")}</option>
                {managers
                  .filter((m) => m.isActive && (editing ? m.shop?._id === editing.id || m.shop?.id === editing.id || !m.shop : !m.shop))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.shop ? `· ${m.shop.name}` : ""}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="label">{t("adminShops.phone")}</label>
              <input value={form.phone} onChange={set("phone")} className="input" placeholder={t("adminShops.phonePlaceholder")} />
            </div>
            <div>
              <label className="label">{t("adminShops.whatsapp")}</label>
              <input value={form.whatsapp} onChange={set("whatsapp")} className="input" placeholder={t("adminShops.whatsappPlaceholder")} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t("adminShops.description")}</label>
              <textarea value={form.description} onChange={set("description")} rows={3} className="input" placeholder={t("adminShops.descriptionPlaceholder")} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t("adminShops.descriptionAr")}</label>
              <textarea value={form.descriptionAr} onChange={set("descriptionAr")} rows={3} className="input" placeholder={t("adminShops.descriptionArPlaceholder")} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t("adminShops.address")}</label>
              <input value={form.address} onChange={set("address")} className="input" placeholder={t("adminShops.addressPlaceholder")} />
            </div>
            <div>
              <label className="label">{t("adminShops.latitude")}</label>
              <input value={form.latitude} onChange={set("latitude")} className="input" placeholder="30.001" type="number" step="any" />
            </div>
            <div>
              <label className="label">{t("adminShops.longitude")}</label>
              <input value={form.longitude} onChange={set("longitude")} className="input" placeholder="31.205" type="number" step="any" />
            </div>
            <div className="sm:col-span-2">
              <LocationButton
                onLocate={({ latitude, longitude }) =>
                  setForm({ ...form, latitude: String(latitude), longitude: String(longitude) })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t("adminShops.googleMapsLink")}</label>
              <input value={form.googleMapsUrl} onChange={set("googleMapsUrl")} className="input" placeholder={t("adminShops.googleMapsPlaceholder")} />
            </div>
            <div className="sm:col-span-2">
              <p className="label">{t("adminShops.socialLinks")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={form.facebook} onChange={set("facebook")} className="input" placeholder={t("adminShops.facebookUrl")} />
                <input value={form.instagram} onChange={set("instagram")} className="input" placeholder={t("adminShops.instagramUrl")} />
                <input value={form.tiktok} onChange={set("tiktok")} className="input" placeholder={t("adminShops.tiktokUrl")} />
                <input value={form.website} onChange={set("website")} className="input" placeholder={t("adminShops.websiteUrl")} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setShowHours((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-600" /> {t("adminShops.workingHours")}
              </span>
              <span className="text-xs text-slate-400">{showHours ? t("adminShops.hide") : t("common.edit")}</span>
            </button>
            {showHours && (
              <div className="border-t border-slate-200 p-4">
                <WorkingHoursEditor
                  value={form.workingHours || {}}
                  onChange={(wh) => setForm({ ...form, workingHours: wh })}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              {t("common.cancel")}
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving && <Spinner size="sm" />}
              {editing ? t("common.saveChanges") : t("adminShops.createShop")}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title={t("adminShops.deleteTitle")}
        message={t("adminShops.deleteMessage", { name: deleteTarget?.name })}
        confirmLabel={t("adminShops.deleteConfirm")}
      />
    </div>
  );
}

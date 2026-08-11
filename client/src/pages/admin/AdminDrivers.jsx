import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Edit3, Trash2, User, Camera, X, Users } from "lucide-react";
import {
  adminGetDrivers,
  adminCreateDriver,
  adminUpdateDriver,
  adminDeleteDriver,
} from "../../services/adminService";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Spinner from "../../components/common/Spinner";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import { SkeletonTable } from "../../components/common/SkeletonCard";
import { usePageMeta } from "../../hooks/usePageMeta";
import { formatDate } from "../../utils/formatters";
import { useTranslation } from "react-i18next";
import { VEHICLE_TYPES } from "../../utils/constants";

const emptyForm = () => ({
  name: "",
  phone: "",
  vehicleType: "",
  photoFile: null,
  photoPreview: "",
  removePhoto: false,
});

export default function AdminDrivers() {
  const { t } = useTranslation();
  usePageMeta(t("meta.adminDrivers"), "");
  const [rows, setRows] = useState(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setRows(null);
    adminGetDrivers({ search, vehicleType, page, limit: 10 })
      .then((res) => setRows(res.data))
      .catch((err) => toast.error(err.safeMessage || t("adminDrivers.failedToLoad")));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, vehicleType, page]);

  const selectTab = (value) => {
    setVehicleType(value);
    setPage(1);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (driver) => {
    setEditing(driver);
    setForm({
      name: driver.name,
      phone: driver.phone,
      vehicleType: driver.vehicleType,
      photoFile: null,
      photoPreview: driver.photo?.url || "",
      removePhoto: false,
    });
    setModalOpen(true);
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handlePhotoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error(t("adminDrivers.photoInvalidType"));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("adminDrivers.photoTooLarge"));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setForm({
      ...form,
      photoFile: file,
      photoPreview: URL.createObjectURL(file),
      removePhoto: false,
    });
  };

  const removePhoto = () => {
    setForm({ ...form, photoFile: null, photoPreview: "", removePhoto: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.warning(t("adminDrivers.nameRequired"));
    if (!form.phone.trim()) return toast.warning(t("adminDrivers.phoneRequired"));
    if (!form.vehicleType) return toast.warning(t("adminDrivers.vehicleTypeRequired"));

    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("phone", form.phone.trim());
    formData.append("vehicleType", form.vehicleType);
    if (form.photoFile) formData.append("photo", form.photoFile);
    if (editing && form.removePhoto) formData.append("removePhoto", "true");

    setSaving(true);
    try {
      if (editing) {
        await adminUpdateDriver(editing.id, formData);
        toast.success(t("adminDrivers.updated"));
      } else {
        await adminCreateDriver(formData);
        toast.success(t("adminDrivers.created"));
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.safeMessage || t("adminDrivers.failedToSave"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await adminDeleteDriver(deleteTarget.id);
      toast.success(t("adminDrivers.deleted"));
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.safeMessage || t("adminDrivers.failedDelete"));
    } finally {
      setDeleting(false);
    }
  };

  const pagination = rows?.pagination;
  const stats = rows?.stats;

  const tabs = [
    { value: "", label: t("adminDrivers.allTypes"), emoji: "", count: stats?.total },
    ...VEHICLE_TYPES.map((v) => ({ ...v, label: t(`drivers.vehicleTypes.${v.value}`), count: stats?.[v.value] })),
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {tabs.map((tab) => (
          <button
            key={tab.value || "all"}
            type="button"
            onClick={() => selectTab(tab.value)}
            className={`card flex items-center gap-3 p-4 text-left transition ${
              vehicleType === tab.value ? "ring-2 ring-brand-500" : "hover:ring-1 hover:ring-slate-300"
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl dark:bg-slate-800">
              {tab.emoji ? tab.emoji : <Users className="h-5 w-5 text-slate-500" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{tab.label}</span>
              <span className="block text-xs font-bold text-brand-600 dark:text-brand-400">{tab.count ?? "…"}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (setSearch(query), setPage(1))}
              placeholder={t("adminDrivers.searchPlaceholder")}
              className="input !pl-10"
            />
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" /> {t("adminDrivers.newDriver")}
        </button>
      </div>

      {!rows ? (
        <SkeletonTable rows={6} cols={5} />
      ) : rows.drivers.length === 0 ? (
        <EmptyState
          title={t("adminDrivers.noDriversTitle")}
          subtitle={t("adminDrivers.noDriversSubtitle")}
          actionLabel={t("adminDrivers.newDriver")}
          onAction={openCreate}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">{t("adminDrivers.colDriver")}</th>
                <th className="px-4 py-3">{t("adminDrivers.colPhone")}</th>
                <th className="px-4 py-3">{t("adminDrivers.colVehicle")}</th>
                <th className="px-4 py-3">{t("adminDrivers.colCreated")}</th>
                <th className="px-4 py-3 text-right">{t("adminDrivers.colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.drivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100">
                        {driver.photo?.url ? (
                          <img src={driver.photo.url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <User className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <span className="font-semibold text-slate-800">{driver.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500" dir="ltr">
                    {driver.phone}
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/30">
                      {t(`drivers.vehicleTypes.${driver.vehicleType}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(driver.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(driver)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
                        title={t("common.edit")}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(driver)}
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t("adminDrivers.editDriver") : t("adminDrivers.addDriver")}
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="label">{t("adminDrivers.photo")}</label>
            <div className="flex flex-wrap items-center gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-slate-100">
                {form.photoPreview ? (
                  <img src={form.photoPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <User className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="btn-secondary cursor-pointer">
                  <Camera className="h-4 w-4" />
                  {t("adminDrivers.choosePhoto")}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoFile}
                  />
                </label>
                {(form.photoPreview || editing) && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                  >
                    <X className="h-3.5 w-3.5" /> {t("adminDrivers.removePhoto")}
                  </button>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">{t("adminDrivers.photoHint")}</p>
          </div>

          <div>
            <label className="label">{t("adminDrivers.name")}</label>
            <input
              value={form.name}
              onChange={set("name")}
              className="input"
              placeholder={t("adminDrivers.namePlaceholder")}
              required
            />
          </div>

          <div>
            <label className="label">{t("adminDrivers.phone")}</label>
            <input
              value={form.phone}
              onChange={set("phone")}
              className="input"
              dir="ltr"
              placeholder={t("adminDrivers.phonePlaceholder")}
              required
              inputMode="tel"
            />
          </div>

          <div>
            <label className="label">{t("adminDrivers.vehicleType")}</label>
            <select value={form.vehicleType} onChange={set("vehicleType")} className="input" required>
              <option value="">{t("adminDrivers.selectVehicleType")}</option>
              {VEHICLE_TYPES.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.emoji} {t(`drivers.vehicleTypes.${v.value}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              {t("common.cancel")}
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving && <Spinner size="sm" />}
              {editing ? t("common.saveChanges") : t("adminDrivers.addDriver")}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title={t("adminDrivers.deleteTitle")}
        message={t("adminDrivers.deleteMessage", { name: deleteTarget?.name })}
        confirmLabel={t("adminDrivers.deleteConfirm")}
      />
    </div>
  );
}

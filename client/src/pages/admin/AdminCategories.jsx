import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Edit3, Trash2, FolderTree, Search } from "lucide-react";
import {
  adminGetCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from "../../services/adminService";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Spinner from "../../components/common/Spinner";
import EmptyState from "../../components/common/EmptyState";
import { SkeletonTable } from "../../components/common/SkeletonCard";
import { usePageMeta } from "../../hooks/usePageMeta";
import { categoryIcon, CATEGORY_ICONS } from "../../utils/constants";
import { useTranslation } from "react-i18next";

const emptyForm = () => ({
  name: "",
  nameAr: "",
  description: "",
  descriptionAr: "",
  icon: "Store",
  isActive: true,
});

export default function AdminCategories() {
  const { t } = useTranslation();
  usePageMeta(t("meta.adminCategories"), "");
  const [categories, setCategories] = useState(null);
  const [query, setQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setCategories(null);
    adminGetCategories()
      .then((res) => setCategories(res.data.categories || []))
      .catch((err) => toast.error(err.safeMessage || t("adminCategories.failedToLoad")));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name,
      nameAr: c.nameAr || "",
      description: c.description || "",
      descriptionAr: c.descriptionAr || "",
      icon: c.icon || "Store",
      isActive: c.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.warning(t("adminCategories.nameRequired"));
    setSaving(true);
    try {
      if (editing) {
        await adminUpdateCategory(editing.id, form);
        toast.success(t("adminCategories.updated"));
      } else {
        await adminCreateCategory(form);
        toast.success(t("adminCategories.created"));
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.safeMessage || t("adminCategories.failedToSave"));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c) => {
    try {
      await adminUpdateCategory(c.id, { isActive: !c.isActive });
      toast.warning(c.isActive ? t("adminCategories.deactivated") : t("adminCategories.activated"));
      load();
    } catch (err) {
      toast.error(err.safeMessage || t("adminCategories.failedStatus"));
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await adminDeleteCategory(deleteTarget.id);
      toast.success(t("adminCategories.deleted"));
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.safeMessage || err.response?.data?.message || t("adminCategories.failedDelete"));
    } finally {
      setDeleting(false);
    }
  };

  const filtered = categories?.filter(
    (c) => !query || c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("adminCategories.searchPlaceholder")}
            className="input !pl-10"
          />
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" /> {t("adminCategories.newCategory")}
        </button>
      </div>

      {!categories ? (
        <SkeletonTable rows={5} cols={4} />
      ) : filtered.length === 0 ? (
        <EmptyState title={t("adminCategories.noCategoriesTitle")} subtitle={t("adminCategories.noCategoriesSubtitle")} actionLabel={t("adminCategories.newCategory")} onAction={openCreate} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">{t("adminCategories.colCategory")}</th>
                <th className="px-4 py-3">{t("adminCategories.colSlug")}</th>
                <th className="px-4 py-3">{t("adminCategories.colDescription")}</th>
                <th className="px-4 py-3">{t("adminCategories.colStatus")}</th>
                <th className="px-4 py-3 text-right">{t("adminCategories.colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => {
                const Icon = categoryIcon(c.slug, c.icon);
                return (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
                          {Icon ? <Icon className="h-5 w-5" /> : <FolderTree className="h-5 w-5" />}
                        </span>
                        <span className="font-semibold text-slate-800">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{c.slug}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-500">{c.description || "—"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(c)}
                        className={`badge ring-1 ${
                          c.isActive
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30 dark:hover:bg-emerald-500/20"
                            : "bg-slate-100 text-slate-500 ring-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {c.isActive ? t("common.active") : t("common.inactive")}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
                          title={t("common.edit")}
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                          title={t("common.delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t("adminCategories.editCategory") : t("adminCategories.createCategory")}
        size="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">{t("adminCategories.name")}</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
          </div>
          <div>
            <label className="label">{t("adminCategories.nameAr")}</label>
            <input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} className="input" placeholder={t("adminCategories.nameArPlaceholder")} />
          </div>
          <div>
            <label className="label">{t("adminCategories.description")}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="input"
            />
          </div>
          <div>
            <label className="label">{t("adminCategories.descriptionAr")}</label>
            <textarea
              value={form.descriptionAr}
              onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
              rows={2}
              className="input"
              placeholder={t("adminCategories.descriptionArPlaceholder")}
            />
          </div>
          <div>
            <label className="label">{t("adminCategories.icon")}</label>
            <select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="input">
              {Object.keys(CATEGORY_ICONS).map((slug) => (
                <option key={slug} value={CATEGORY_ICONS[slug].displayName}>
                  {CATEGORY_ICONS[slug].displayName}
                </option>
              ))}
              <option value="Store">Store</option>
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            {t("adminCategories.categoryActive")}
          </label>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              {t("common.cancel")}
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving && <Spinner size="sm" />}
              {editing ? t("common.saveChanges") : t("adminCategories.createCategory")}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title={t("adminCategories.deleteTitle")}
        message={t("adminCategories.deleteMessage", { name: deleteTarget?.name })}
        confirmLabel={t("adminCategories.deleteConfirm")}
      />
    </div>
  );
}

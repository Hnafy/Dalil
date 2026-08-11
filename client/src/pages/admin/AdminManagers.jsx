import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  KeyRound,
  Search,
} from "lucide-react";
import {
  adminGetManagers,
  adminCreateManager,
  adminUpdateManager,
  adminDeleteManager,
  adminResetManagerPassword,
  adminGetShops,
} from "../../services/adminService";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Spinner from "../../components/common/Spinner";
import EmptyState from "../../components/common/EmptyState";
import { SkeletonTable } from "../../components/common/SkeletonCard";
import { usePageMeta } from "../../hooks/usePageMeta";
import { formatDate } from "../../utils/formatters";
import { useTranslation, Trans } from "react-i18next";
import { localize } from "../../utils/i18n";

const emptyForm = () => ({
  name: "",
  email: "",
  password: "",
  shopId: "",
  isActive: true,
});

export default function AdminManagers() {
  const { t } = useTranslation();
  usePageMeta(t("meta.adminManagers"), "");
  const [managers, setManagers] = useState(null);
  const [shops, setShops] = useState([]);
  const [query, setQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    adminGetShops({ limit: 100 })
      .then((res) => setShops(res.data.shops || []))
      .catch(() => setShops([]));
  }, []);

  const load = () => {
    setManagers(null);
    adminGetManagers()
      .then((res) => setManagers(res.data.managers || []))
      .catch((err) => toast.error(err.safeMessage || t("adminManagers.failedToLoad")));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({
      name: m.name,
      email: m.email,
      password: "",
      shopId: m.shop?._id || m.shop?.id || "",
      isActive: m.isActive,
    });
    setModalOpen(true);
  };

  const set = (key) => (e) => {
    const value = key === "isActive" ? e.target.checked : e.target.value;
    setForm({ ...form, [key]: value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.warning(t("adminManagers.nameRequired"));
    if (!form.shopId) return toast.warning(t("adminManagers.shopRequired"));

    setSaving(true);
    try {
      if (editing) {
        await adminUpdateManager(editing.id, {
          name: form.name,
          email: form.email,
          shopId: form.shopId,
          isActive: form.isActive,
        });
        toast.success(t("adminManagers.updated"));
      } else {
        if (!form.password) return toast.warning(t("adminManagers.passwordRequired"));
        await adminCreateManager({
          name: form.name,
          email: form.email,
          password: form.password,
          shopId: form.shopId,
          isActive: form.isActive,
        });
        toast.success(t("adminManagers.created"));
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.safeMessage || t("adminManagers.failedToSave"));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (m) => {
    try {
      await adminUpdateManager(m.id, { isActive: !m.isActive });
      toast.warning(
        m.isActive
          ? t("adminManagers.disabled", { name: m.name })
          : t("adminManagers.enabled", { name: m.name })
      );
      load();
    } catch (err) {
      toast.error(err.safeMessage || t("adminManagers.failedStatus"));
    }
  };

  const confirmReset = async () => {
    setResetting(true);
    try {
      await adminResetManagerPassword(resetTarget.id, newPassword);
      toast.success(t("adminManagers.passwordReset", { name: resetTarget.name }));
      setResetTarget(null);
      setNewPassword("");
    } catch (err) {
      toast.error(err.safeMessage || t("adminManagers.failedReset"));
    } finally {
      setResetting(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await adminDeleteManager(deleteTarget.id);
      toast.success(t("adminManagers.deleted"));
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.safeMessage || t("adminManagers.failedDelete"));
    } finally {
      setDeleting(false);
    }
  };

  const filtered = managers?.filter(
    (m) =>
      !query ||
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("adminManagers.searchPlaceholder")}
            className="input !pl-10"
          />
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" /> {t("adminManagers.newManager")}
        </button>
      </div>

      {!managers ? (
        <SkeletonTable rows={5} cols={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t("adminManagers.noManagersTitle")}
          subtitle={t("adminManagers.noManagersSubtitle")}
          actionLabel={t("adminManagers.newManager")}
          onAction={openCreate}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">{t("adminManagers.colName")}</th>
                <th className="px-4 py-3">{t("adminManagers.colEmail")}</th>
                <th className="px-4 py-3">{t("adminManagers.colShop")}</th>
                <th className="px-4 py-3">{t("adminManagers.colStatus")}</th>
                <th className="px-4 py-3">{t("adminManagers.colCreatedAt")}</th>
                <th className="px-4 py-3 text-right">{t("adminManagers.colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-800">{m.name}</td>
                  <td className="px-4 py-3 text-slate-500">{m.email}</td>
                  <td className="px-4 py-3 text-slate-500">{localize(m.shop, "name") || "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(m)}
                      className={`badge ring-1 ${
                        m.isActive
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30 dark:hover:bg-emerald-500/20"
                          : "bg-slate-100 text-slate-500 ring-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {m.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      {m.isActive ? t("common.active") : t("common.disabled")}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(m.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(m)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
                        title={t("common.edit")}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setResetTarget(m);
                          setNewPassword("");
                        }}
                        className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                        title={t("adminManagers.resetPassword")}
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(m)}
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t("adminManagers.editManager") : t("adminManagers.createManager")}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">{t("adminManagers.fullName")}</label>
            <input value={form.name} onChange={set("name")} className="input" required />
          </div>
          <div>
            <label className="label">{t("adminManagers.email")}</label>
            <input type="email" value={form.email} onChange={set("email")} className="input" required />
          </div>
          {!editing && (
            <div>
              <label className="label">{t("adminManagers.tempPassword")}</label>
              <input
                value={form.password}
                onChange={set("password")}
                type="text"
                className="input"
                minLength={6}
                placeholder={t("adminManagers.tempPasswordPlaceholder")}
                required
              />
              <p className="mt-1 text-xs text-slate-400">
                {t("adminManagers.tempPasswordHint")}
              </p>
            </div>
          )}
          <div>
            <label className="label">{t("adminManagers.linkedShop")}</label>
            <select value={form.shopId} onChange={set("shopId")} className="input" required>
              <option value="">{t("adminManagers.selectShop")}</option>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.status === "inactive" ? t("adminManagers.inactiveTag") : ""}
                </option>
              ))}
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={set("isActive")}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            {t("adminManagers.accountActive")}
          </label>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              {t("common.cancel")}
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving && <Spinner size="sm" />}
              {editing ? t("common.saveChanges") : t("adminManagers.createManager")}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title={t("adminManagers.resetTitle")}
        size="sm"
      >
        <p className="text-sm text-slate-600">
          <Trans i18nKey="adminManagers.resetText" values={{ name: resetTarget?.name }} />
        </p>
        <div className="mt-4">
          <label className="label">{t("adminManagers.newTempPassword")}</label>
          <input
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input"
            minLength={6}
            placeholder={t("adminManagers.newPasswordPlaceholder")}
          />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={() => setResetTarget(null)} className="btn-secondary">
            {t("common.cancel")}
          </button>
          <button onClick={confirmReset} disabled={resetting || newPassword.length < 6} className="btn-primary">
            {resetting && <Spinner size="sm" />}
            {t("adminManagers.resetPassword")}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title={t("adminManagers.deleteTitle")}
        message={t("adminManagers.deleteMessage", { name: deleteTarget?.name })}
        confirmLabel={t("adminManagers.deleteConfirm")}
      />
    </div>
  );
}

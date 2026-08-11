import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";
import Spinner from "./Spinner";
import { useTranslation } from "react-i18next";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  loading = false,
  danger = true,
}) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            danger ? "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-300" : "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="text-sm leading-relaxed text-slate-600">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} disabled={loading} className="btn-secondary">
          {t("common.cancel")}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={danger ? "btn-danger" : "btn-primary"}
        >
          {loading && <Spinner size="sm" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

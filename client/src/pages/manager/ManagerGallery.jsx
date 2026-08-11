import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { UploadCloud, Trash2, ImagePlus, Loader2 } from "lucide-react";
import { getMyShop, uploadImages, deleteImage } from "../../services/managerService";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useTranslation } from "react-i18next";

export default function ManagerGallery() {
  const { t } = useTranslation();
  usePageMeta(t("meta.managerGallery"), "");
  const [shop, setShop] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef(null);

  const loadShop = () => {
    getMyShop()
      .then((res) => setShop(res.data))
      .catch((err) => toast.error(err.safeMessage || t("managerGallery.failedToLoad")));
  };

  useEffect(() => {
    loadShop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (e) => {
    const selected = Array.from(e.target.files || []).slice(0, 10);
    setFiles(selected);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.warning(t("managerGallery.chooseFirst"));
      return;
    }
    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));
    setUploading(true);
    toast.loading(t("managerGallery.uploading"), { id: "upload" });
    try {
      await uploadImages(formData);
      toast.success(t("managerGallery.uploaded", { count: files.length }), { id: "upload" });
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
      loadShop();
    } catch (err) {
      toast.error(err.safeMessage || t("managerGallery.failedUpload"), { id: "upload" });
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteImage(deleteTarget._id);
      toast.success(t("managerGallery.imageDeleted"));
      setDeleteTarget(null);
      loadShop();
    } catch (err) {
      toast.error(err.safeMessage || t("managerGallery.failedDelete"));
    } finally {
      setDeleting(false);
    }
  };

  const images = shop?.images || [];

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-900">{t("managerGallery.uploadPhotos")}</h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleSelect}
            className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-brand-50 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-950/40 dark:file:text-brand-300 dark:hover:file:bg-brand-900/60"
          />
          <button onClick={handleUpload} disabled={uploading} className="btn-primary shrink-0">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {uploading ? t("managerGallery.uploading") : t("managerGallery.upload")}
          </button>
        </div>
        {files.length > 0 && (
          <p className="mt-3 text-sm text-slate-500">{t("managerGallery.fileHint", { count: files.length })}</p>
        )}
      </div>

      {images.length === 0 ? (
        <div className="card flex flex-col items-center justify-center border-2 border-dashed border-slate-200 px-6 py-16 text-center">
          <ImagePlus className="mb-3 h-10 w-10 text-slate-300" />
          <p className="font-semibold text-slate-600">{t("managerGallery.noPhotosTitle")}</p>
          <p className="mt-1 text-sm text-slate-400">{t("managerGallery.noPhotosSubtitle")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img) => (
            <div key={img._id} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
              <img src={img.url} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => setDeleteTarget(img)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-600 shadow transition hover:bg-red-50"
                  title={t("managerGallery.deleteImageTitle")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title={t("managerGallery.deleteTitle")}
        message={t("managerGallery.deleteMessage")}
        confirmLabel={t("managerGallery.deleteConfirm")}
      />
    </div>
  );
}

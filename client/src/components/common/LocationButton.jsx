import { useState } from "react";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import Spinner from "./Spinner";

const round6 = (n) => Math.round(n * 1e6) / 1e6;

export default function LocationButton({ onLocate, className = "" }) {
  const { t } = useTranslation();
  const [locating, setLocating] = useState(false);

  const handleClick = () => {
    if (!("geolocation" in navigator)) {
      toast.error(t("locationButton.unsupported"));
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onLocate({
          latitude: round6(pos.coords.latitude),
          longitude: round6(pos.coords.longitude),
        });
      },
      (err) => {
        setLocating(false);
        const message = (() => {
          switch (err.code) {
            case err.PERMISSION_DENIED:
              return t("locationButton.permissionDenied");
            case err.POSITION_UNAVAILABLE:
              return t("locationButton.unavailable");
            case err.TIMEOUT:
              return t("locationButton.timeout");
            default:
              return t("locationButton.unavailable");
          }
        })();
        toast.error(message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <button type="button" onClick={handleClick} disabled={locating} className={`btn-secondary !py-2 ${className}`}>
      {locating ? <Spinner size="sm" /> : <MapPin className="h-4 w-4" />}
      {locating ? t("locationButton.locating") : t("locationButton.label")}
    </button>
  );
}

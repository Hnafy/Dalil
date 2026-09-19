import { useEffect, useRef, useState } from "react";
import { calculateOpenStatus } from "../utils/openStatus";

export function useShopStatus(workingHours, manualStatus = "auto") {
  const [status, setStatus] = useState(() => calculateOpenStatus(workingHours, new Date(), manualStatus));
  const hoursRef = useRef(workingHours);
  const manualRef = useRef(manualStatus);

  useEffect(() => {
    hoursRef.current = workingHours;
    manualRef.current = manualStatus;
    setStatus(calculateOpenStatus(workingHours, new Date(), manualStatus));
    const id = setInterval(() => {
      setStatus(calculateOpenStatus(hoursRef.current, new Date(), manualRef.current));
    }, 60 * 1000);
    return () => clearInterval(id);
  }, [workingHours, manualStatus]);

  return status;
}

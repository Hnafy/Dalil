import { useEffect, useRef, useState } from "react";
import { calculateOpenStatus } from "../utils/openStatus";

export function useShopStatus(workingHours) {
  const [status, setStatus] = useState(() => calculateOpenStatus(workingHours));
  const hoursRef = useRef(workingHours);

  useEffect(() => {
    hoursRef.current = workingHours;
    setStatus(calculateOpenStatus(workingHours));
    const id = setInterval(() => {
      setStatus(calculateOpenStatus(hoursRef.current));
    }, 60 * 1000);
    return () => clearInterval(id);
  }, [workingHours]);

  return status;
}

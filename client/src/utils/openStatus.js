// Mirrors server/src/utils/calculateOpenStatus.js (client-side live status).
const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function toMinutes(time) {
  if (typeof time !== "string") return 0;
  const [h, m] = time.split(":");
  return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0);
}

function formatMinutes(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function dayKeyForIndex(index) {
  return DAY_KEYS[((index % 7) + 7) % 7];
}

export function calculateOpenStatus(workingHours, now = new Date()) {
  const fallback = { isOpen: false, nextOpenAt: null };
  if (!workingHours || typeof workingHours !== "object") return fallback;

  const minutes = now.getHours() * 60 + now.getMinutes();
  const todayIdx = now.getDay();

  const dayFor = (offset) => workingHours[dayKeyForIndex(todayIdx + offset)];
  const today = dayFor(0);

  let isOpen = false;

  if (today && today.isOpen) {
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);
    if (open <= close) {
      isOpen = minutes >= open && minutes < close;
    } else {
      isOpen = minutes >= open || minutes < close;
    }
  }

  if (!isOpen) {
    const yesterday = dayFor(-1);
    if (yesterday && yesterday.isOpen) {
      const open = toMinutes(yesterday.open);
      const close = toMinutes(yesterday.close);
      if (open > close && minutes < close) isOpen = true;
    }
  }

  let nextOpenAt = null;
  if (!isOpen) {
    for (let offset = 0; offset < 7; offset += 1) {
      const d = dayFor(offset);
      if (!d || !d.isOpen) continue;
      const open = toMinutes(d.open);
      if (offset === 0) {
        if (open > minutes) {
          nextOpenAt = formatMinutes(open);
          break;
        }
      } else {
        nextOpenAt = formatMinutes(open);
        break;
      }
    }
  }

  return { isOpen, nextOpenAt };
}

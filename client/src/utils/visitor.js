import { fetchVisitorId } from "../services/analyticsService";

const VISITOR_KEY = "dalil_visitor_id";
let cachedId = null;
let pendingPromise = null;

export function getVisitorId() {
  if (cachedId) return cachedId;
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `v-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    cachedId = id;
    return id;
  } catch {
    return `v-${Date.now()}`;
  }
}

export function ensureVisitorId() {
  if (cachedId) return Promise.resolve(cachedId);
  if (pendingPromise) return pendingPromise;
  pendingPromise = fetchVisitorId()
    .then((id) => {
      let storedId = null;
      try {
        storedId = localStorage.getItem(VISITOR_KEY);
      } catch {
        // storage unavailable — in-memory only
      }
      if (storedId) {
        cachedId = storedId;
        return storedId;
      }
      cachedId = id;
      try {
        localStorage.setItem(VISITOR_KEY, id);
      } catch {
        // storage unavailable — in-memory only
      }
      return id;
    })
    .catch(() => {
      cachedId = getVisitorId();
      return cachedId;
    })
    .finally(() => {
      pendingPromise = null;
    });
  return pendingPromise;
}

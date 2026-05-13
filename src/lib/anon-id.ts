// Anonymous visitor ID + session ID helpers (localStorage)

const ANON_KEY = "ci_anon_id";
const SESSION_KEY = "ci_session_id";
const SESSION_TS = "ci_session_ts";
const SESSION_TTL = 30 * 60 * 1000; // 30 min

function uuid() {
  // simple uuid v4-ish
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getAnonId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(ANON_KEY);
  if (!id) {
    id = uuid();
    localStorage.setItem(ANON_KEY, id);
  }
  return id;
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const now = Date.now();
  const ts = Number(sessionStorage.getItem(SESSION_TS) ?? 0);
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id || now - ts > SESSION_TTL) {
    id = uuid();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  sessionStorage.setItem(SESSION_TS, String(now));
  return id;
}

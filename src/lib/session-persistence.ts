// "Keep me signed in": on by default, so returning visitors stay signed in. When a visitor unticks it on the
// sign-in screen, their session is kept only for the current browser tab/window and is gone once it closes.

const KEY = "ci_keep_signed_in";

export function getKeepSignedIn(): boolean {
  try {
    return localStorage.getItem(KEY) !== "0";
  } catch {
    return true;
  }
}

/** Call right before signing in (password or Google), so the new session is stored the chosen way. */
export function setKeepSignedIn(keep: boolean) {
  try {
    localStorage.setItem(KEY, keep ? "1" : "0");
  } catch {
    /* storage blocked: sessions then live in memory only, which is the safe fallback */
  }
}

type AuthStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

/** Where the Supabase session lives: localStorage when kept, sessionStorage when not. Reads look in both. */
export const keepAwareStorage: AuthStorage = {
  getItem(key) {
    try {
      return sessionStorage.getItem(key) ?? localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      const [target, other] = getKeepSignedIn() ? [localStorage, sessionStorage] : [sessionStorage, localStorage];
      target.setItem(key, value);
      other.removeItem(key);
    } catch {
      /* ignore */
    }
  },
  removeItem(key) {
    try {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

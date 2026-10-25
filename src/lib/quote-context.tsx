import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { syncQuoteDraft } from "@/lib/billing.functions";

export interface QuoteLine {
  id: string; // service or product id
  type: "service" | "product";
  slug: string;
  title: string;
  unitPrice: number; // naira, 0 when on request
  onRequest: boolean;
  quantity: number;
}

interface QuoteState {
  lines: QuoteLine[];
  count: number;
  estimate: number;
  hasOnRequest: boolean;
  /** True once every line is priced on request (the normal case for services). */
  allOnRequest: boolean;
  isOpen: boolean;
  draftKey: string;
  setOpen: (b: boolean) => void;
  add: (
    line: Omit<QuoteLine, "quantity">,
    qty?: number,
    opts?: { open?: boolean },
  ) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  has: (id: string) => boolean;
  clear: () => void;
  /** Replaces the whole selection (used when restoring a saved draft). */
  replace: (lines: QuoteLine[]) => void;
  /** Starts a fresh request after one has been submitted. */
  reset: () => void;
}

const QuoteContext = createContext<QuoteState | null>(null);
const STORAGE_KEY = "ci_quote_v1";
const DRAFT_KEY = "ci_quote_draft_key";

function newDraftKey() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [draftKey, setDraftKey] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const sync = useServerFn(syncQuoteDraft);
  const lastSynced = useRef("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
      const existing = localStorage.getItem(DRAFT_KEY);
      if (existing && /^[a-f0-9]{16,64}$/.test(existing)) {
        setDraftKey(existing);
      } else {
        const key = newDraftKey();
        localStorage.setItem(DRAFT_KEY, key);
        setDraftKey(key);
      }
    } catch {
      setDraftKey(newDraftKey());
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {}
  }, [lines]);

  // Persist the selection server-side as it changes, so a request is recorded
  // even if the visitor never signs in or never submits.
  useEffect(() => {
    if (!hydrated || !draftKey) return;
    const items = lines.map((l) => ({ type: l.type, id: l.id, quantity: l.quantity }));
    const signature = JSON.stringify(items);
    if (signature === lastSynced.current) return;
    const timer = setTimeout(() => {
      lastSynced.current = signature;
      sync({ data: { draft_key: draftKey, items } }).catch(() => {});
    }, 700);
    return () => clearTimeout(timer);
  }, [lines, draftKey, hydrated, sync]);

  const add: QuoteState["add"] = (line, qty = 1, opts) => {
    setLines((prev) => {
      const existing = prev.find((p) => p.id === line.id);
      if (existing) {
        return prev.map((p) => (p.id === line.id ? { ...p, quantity: p.quantity + qty } : p));
      }
      return [...prev, { ...line, quantity: qty }];
    });
    toast.success(`${line.title} added to your request`);
    if (opts?.open !== false) setOpen(true);
  };

  const remove: QuoteState["remove"] = (id) =>
    setLines((prev) => prev.filter((p) => p.id !== id));

  const setQty: QuoteState["setQty"] = (id, qty) =>
    setLines((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantity: Math.max(1, Math.min(999, qty)) } : p)),
    );

  const clear = () => setLines([]);

  const replace = (next: QuoteLine[]) => {
    lastSynced.current = "";
    setLines(next);
  };

  const reset = () => {
    setLines([]);
    lastSynced.current = "";
    let key = newDraftKey();
    try {
      key = newDraftKey();
      localStorage.setItem(DRAFT_KEY, key);
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setDraftKey(key);
  };

  const value = useMemo<QuoteState>(() => {
    const count = lines.reduce((s, l) => s + l.quantity, 0);
    const estimate = lines.reduce((s, l) => s + (l.onRequest ? 0 : l.unitPrice * l.quantity), 0);
    return {
      lines,
      count,
      estimate,
      hasOnRequest: lines.some((l) => l.onRequest),
      allOnRequest: lines.length > 0 && lines.every((l) => l.onRequest),
      isOpen,
      draftKey,
      setOpen,
      add,
      remove,
      setQty,
      has: (id: string) => lines.some((l) => l.id === id),
      clear,
      replace,
      reset,
    };
  }, [lines, isOpen, draftKey]);

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}

export function useQuoteBuilder() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuoteBuilder must be used within QuoteProvider");
  return ctx;
}

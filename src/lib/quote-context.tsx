import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

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
  isOpen: boolean;
  setOpen: (b: boolean) => void;
  add: (line: Omit<QuoteLine, "quantity">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  has: (id: string) => boolean;
  clear: () => void;
}

const QuoteContext = createContext<QuoteState | null>(null);
const STORAGE_KEY = "ci_quote_v1";

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {}
  }, [lines]);

  const add: QuoteState["add"] = (line, qty = 1) => {
    setLines((prev) => {
      const existing = prev.find((p) => p.id === line.id);
      if (existing) {
        return prev.map((p) => (p.id === line.id ? { ...p, quantity: p.quantity + qty } : p));
      }
      return [...prev, { ...line, quantity: qty }];
    });
    toast.success(`${line.title} added to your quote`);
    setOpen(true);
  };

  const remove: QuoteState["remove"] = (id) =>
    setLines((prev) => prev.filter((p) => p.id !== id));

  const setQty: QuoteState["setQty"] = (id, qty) =>
    setLines((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: Math.max(1, Math.min(999, qty)) } : p)));

  const clear = () => setLines([]);

  const value = useMemo<QuoteState>(() => {
    const count = lines.reduce((s, l) => s + l.quantity, 0);
    const estimate = lines.reduce((s, l) => s + (l.onRequest ? 0 : l.unitPrice * l.quantity), 0);
    return {
      lines,
      count,
      estimate,
      hasOnRequest: lines.some((l) => l.onRequest),
      isOpen,
      setOpen,
      add,
      remove,
      setQty,
      has: (id: string) => lines.some((l) => l.id === id),
      clear,
    };
  }, [lines, isOpen]);

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}

export function useQuoteBuilder() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuoteBuilder must be used within QuoteProvider");
  return ctx;
}

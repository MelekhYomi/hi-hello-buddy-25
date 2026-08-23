import { Link } from "@tanstack/react-router";
import { FileText, Minus, Plus, Trash2, X, ArrowRight } from "lucide-react";
import { useQuoteBuilder } from "@/lib/quote-context";
import { formatNaira } from "@/lib/cart-context";

export function QuoteFab() {
  const { count, setOpen, isOpen } = useQuoteBuilder();
  if (!count || isOpen) return null;
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="fixed bottom-6 left-6 z-40 inline-flex items-center gap-2 rounded-full border border-imperium bg-card px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-imperium shadow-[0_0_30px_-8px_var(--imperium)]"
    >
      <FileText className="h-4 w-4" />
      Quote ({count})
    </button>
  );
}

export function QuoteDrawer() {
  const { lines, isOpen, setOpen, remove, setQty, estimate, hasOnRequest, clear } = useQuoteBuilder();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60" onClick={() => setOpen(false)} />
      <aside className="flex h-full w-full max-w-md flex-col border-l border-border bg-background">
        <header className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-imperium">
              Your selection
            </div>
            <h2 className="mt-1 font-display text-2xl">QUOTE BUILDER</h2>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close quote builder">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!lines.length && (
            <p className="text-sm text-muted-foreground">
              Nothing selected yet. Add services or products and your quote total updates instantly.
            </p>
          )}
          <ul className="space-y-4">
            {lines.map((l) => (
              <li key={l.id} className="rounded-lg border border-border/60 bg-card/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{l.title}</div>
                    <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {l.type}
                    </div>
                  </div>
                  <button type="button" onClick={() => remove(l.id)} aria-label={`Remove ${l.title}`}>
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-md border border-border">
                    <button
                      type="button"
                      className="px-2 py-1"
                      onClick={() => setQty(l.id, l.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="min-w-6 text-center text-sm">{l.quantity}</span>
                    <button
                      type="button"
                      className="px-2 py-1"
                      onClick={() => setQty(l.id, l.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-sm text-imperium">
                    {l.onRequest ? "On request" : formatNaira(l.unitPrice * l.quantity)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <footer className="border-t border-border px-6 py-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Estimated total</span>
            <span className="font-display text-2xl text-imperium">{formatNaira(estimate)}</span>
          </div>
          {hasOnRequest && (
            <p className="mt-2 text-xs text-muted-foreground">
              Some items are scoped on request — we'll confirm those figures with you.
            </p>
          )}
          <Link
            to="/quote"
            onClick={() => setOpen(false)}
            className="btn-cta mt-4 inline-flex h-12 w-full items-center justify-center gap-2 px-6"
          >
            Review my quote <ArrowRight className="h-4 w-4" />
          </Link>
          {!!lines.length && (
            <button
              type="button"
              onClick={clear}
              className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Clear selection
            </button>
          )}
        </footer>
      </aside>
    </div>
  );
}

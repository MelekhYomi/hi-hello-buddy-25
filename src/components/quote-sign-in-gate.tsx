import { Link } from "@tanstack/react-router";
import { X, ArrowRight, ShieldCheck } from "lucide-react";

/**
 * Shown the first time a signed-out visitor asks for a quote. The selection is
 * already saved (locally and on the server), so signing in is the only step
 * left — and it is what lets us answer the request.
 */
export function QuoteSignInGate({
  open,
  count,
  onClose,
}: {
  open: boolean;
  count: number;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[210] flex items-end justify-center bg-black/70 px-4 pb-6 sm:items-center sm:pb-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quote-gate-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md border border-border/70 bg-background p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-imperium">
          One quick step
        </div>
        <h2 id="quote-gate-title" className="mt-3 font-display text-2xl leading-tight">
          Sign in to send your request
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your {count === 1 ? "item is" : `${count} items are`} saved. We keep quotes on your
          account so the team can price them and reply on WhatsApp — and so you can pick up
          exactly where you left off.
        </p>

        <Link
          to="/login"
          search={{ redirect: "/quote" }}
          className="btn-cta mt-6 inline-flex h-12 w-full items-center justify-center gap-2 px-6"
        >
          Sign in <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/signup"
          search={{ redirect: "/quote" }}
          className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 border border-border px-6 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground transition-colors hover:border-imperium hover:text-imperium"
        >
          Create an account
        </Link>

        <div className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-imperium" strokeWidth={1.8} />
          <span>Nothing is lost. Your selection stays here until you come back.</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useQuoteBuilder } from "@/lib/quote-context";

const DISMISSED_KEY = "ci_signin_nudge_dismissed";

// Prompts a guest to sign in the moment they show buying intent. For a quote
// request it explains why the account matters; either way the selection is
// already saved, so nothing is lost if they close this.
export function SignInNudge() {
  const { user, loading } = useAuth();
  const { count: cartCount } = useCart();
  const { count: quoteCount } = useQuoteBuilder();
  const [show, setShow] = useState(false);
  const seenSelection = useRef(false);

  useEffect(() => {
    if (loading || user) return;
    if (cartCount === 0 && quoteCount === 0) return;
    if (seenSelection.current) return;
    seenSelection.current = true;

    try {
      if (sessionStorage.getItem(DISMISSED_KEY)) return;
    } catch {}
    setShow(true);
  }, [loading, user, cartCount, quoteCount]);

  const dismiss = () => {
    setShow(false);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {}
  };

  if (!show) return null;

  const forQuote = quoteCount > 0 && cartCount === 0;
  const redirect = forQuote ? "/quote" : undefined;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4">
      <div className="relative w-full max-w-sm rounded-lg border border-imperium/40 bg-background p-6 shadow-2xl">
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <LogIn className="h-8 w-8 text-imperium" strokeWidth={1.5} />
        <h2 className="mt-4 font-display text-xl">
          {forQuote ? "Sign in to send your request" : "Sign in to continue?"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {forQuote
            ? "Your selection is saved. An account lets us record the quote against you, price it, and reply promptly — and you can pick up where you left off."
            : "Create an account or sign in to save your selection, track your order, and pick up where you left off next time."}
        </p>
        <Link
          to="/login"
          search={{ redirect }}
          onClick={dismiss}
          className="btn-cta mt-5 inline-flex h-11 w-full items-center justify-center px-6"
        >
          Sign in
        </Link>
        <Link
          to="/signup"
          search={{ redirect }}
          onClick={dismiss}
          className="mt-2 inline-flex h-11 w-full items-center justify-center border border-border px-6 font-mono text-[11px] uppercase tracking-[0.2em] hover:border-imperium hover:text-imperium"
        >
          Create an account
        </Link>
        <button
          onClick={dismiss}
          className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

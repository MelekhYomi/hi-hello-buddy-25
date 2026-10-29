import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useQuoteBuilder } from "@/lib/quote-context";

const DISMISSED_KEY = "ci_signin_nudge_dismissed";

// Prompts a guest to sign in the moment they show buying intent (first
// product or service selected), without blocking them — they can dismiss
// and continue as a guest. Only fires once per browser session so adding
// several items in a row doesn't spam the same popup.
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
        <h2 className="mt-4 font-display text-xl">Sign in to continue?</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Create an account or sign in to save your selection, track your order or quote, and pick up
          where you left off next time.
        </p>
        <Link
          to="/login"
          onClick={dismiss}
          className="btn-cta mt-5 inline-flex h-11 w-full items-center justify-center px-6"
        >
          Sign in
        </Link>
        <button
          onClick={dismiss}
          className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          Continue as guest
        </button>
      </div>
    </div>
  );
}

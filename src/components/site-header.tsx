import { useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import logoAsset from "@/assets/cimperium-c-mark.png.asset.json";

const logo = logoAsset?.url || "/cimperium-c-mark.png";

const SECTIONS = [
  { id: "about", label: "About" },
  { id: "products", label: "Products" },
  { id: "services", label: "Services" },
  { id: "portfolio", label: "Portfolio" },
  { id: "testimonials", label: "Testimonials" },
  { id: "blog", label: "Blog" },
  { id: "book", label: "Book" },
  { id: "contact", label: "Contact" },
];

export function SiteHeader() {
  const { user, signOut, isAdmin } = useAuth();
  const { count, setOpen } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const goToSection = (id: string) => async (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(false);
    if (location.pathname !== "/") {
      await navigate({ to: "/" });
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2" aria-label="C Imperium home">
          <img
            src={logo}
            alt="C Imperium"
            className="h-10 w-10 object-contain"
          />
        </Link>

        <nav className="hidden items-center gap-7 text-xs font-mono uppercase tracking-[0.2em] md:flex">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} onClick={goToSection(s.id)} className="story-link text-muted-foreground hover:text-foreground transition-colors">
              {s.label}
            </a>
          ))}
          {user ? (
            <>
              {isAdmin ? (
                <Link to="/dashboard" className="story-link text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
              ) : (
                <Link to="/account" className="story-link text-muted-foreground hover:text-foreground transition-colors">My Account</Link>
              )}
              <button onClick={() => signOut()} className="story-link text-muted-foreground hover:text-foreground transition-colors">Sign out</button>
            </>
          ) : (
            <Link to="/login" className="story-link text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open cart"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-imperium"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-imperium px-1 font-mono text-[9px] font-bold text-charleston">
                {count}
              </span>
            )}
          </button>
          <a href="#book" onClick={goToSection("book")} className="btn-cta hidden h-9 px-4 md:inline-flex">
            Book Consultation
          </a>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 text-sm font-mono uppercase tracking-[0.2em]">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={goToSection(s.id)}
                className="flex items-center py-2.5 text-muted-foreground hover:text-foreground"
              >
                {s.label}
              </a>
            ))}
            {user ? (
              <>
                {isAdmin ? (
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center py-2.5 text-muted-foreground hover:text-foreground">Dashboard</Link>
                ) : (
                  <Link to="/account" onClick={() => setMenuOpen(false)} className="flex items-center py-2.5 text-muted-foreground hover:text-foreground">My Account</Link>
                )}
                <button onClick={() => { setMenuOpen(false); signOut(); }} className="flex items-center py-2.5 text-left text-muted-foreground hover:text-foreground">Sign out</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="flex items-center py-2.5 text-muted-foreground hover:text-foreground">Sign in</Link>
            )}
            <a href="#book" onClick={goToSection("book")} className="btn-cta mt-3 h-11 w-full justify-center">
              Book Consultation
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}


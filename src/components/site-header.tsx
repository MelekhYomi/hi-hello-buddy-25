import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import logoAsset from "@/assets/cimperium-c-mark.jpg.asset.json";
const logo = logoAsset.url;

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
  const { user, signOut } = useAuth();
  const { count, setOpen } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const goToSection = (id: string) => async (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname !== "/") {
      await navigate({ to: "/" });
      // wait a tick for render
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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ring-1 ring-imperium/40 transition-all group-hover:ring-imperium">
            <img
              src={logo}
              alt="C Imperium"
              className="h-full w-full object-cover"
            />
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-xs font-mono uppercase tracking-[0.2em] md:flex">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={goToSection(s.id)}
              className="story-link text-muted-foreground hover:text-foreground transition-colors"
            >
              {s.label}
            </a>
          ))}
          {user ? (
            <>
              <Link to="/dashboard" className="story-link text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
              <button
                onClick={() => signOut()}
                className="story-link text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="story-link text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
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
          <a
            href="#book"
            onClick={goToSection("book")}
            className="btn-cta hidden h-9 px-4 md:inline-flex"
          >
            Book Consultation
          </a>
        </div>
      </div>
    </header>
  );
}

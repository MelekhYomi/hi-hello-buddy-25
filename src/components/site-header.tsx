import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/cimperium-logo.png";

const SECTIONS = [
  { id: "products", label: "Products" },
  { id: "services", label: "Services" },
  { id: "portfolio", label: "Portfolio" },
  { id: "testimonials", label: "Testimonials" },
  { id: "book", label: "Book" },
  { id: "contact", label: "Contact" },
];

export function SiteHeader() {
  const { user, signOut } = useAuth();
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
          <span className="relative inline-flex items-center justify-center rounded-md bg-imperium/10 ring-1 ring-imperium/30 px-2 py-1 transition-all group-hover:bg-imperium/20 group-hover:ring-imperium/60">
            <img
              src={logo}
              alt="C Imperium"
              className="h-7 w-auto brightness-125 contrast-110 drop-shadow-[0_0_8px_oklch(0.85_0.18_95/0.6)]"
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
        <a
          href="#book"
          onClick={goToSection("book")}
          className="btn-cta hidden h-9 px-4 md:inline-flex"
        >
          Book Consultation
        </a>
      </div>
    </header>
  );
}

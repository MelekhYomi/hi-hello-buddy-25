import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export function SiteHeader() {
  const { user, isAdmin, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-2xl text-imperium leading-none">C</span>
          <span className="font-display text-xl tracking-wider">IMPERIUM</span>
        </Link>
        <nav className="hidden items-center gap-8 text-xs font-mono uppercase tracking-[0.2em] md:flex">
          <Link to="/" hash="services" className="story-link text-muted-foreground hover:text-foreground transition-colors">Services</Link>
          <Link to="/" hash="portfolio" className="story-link text-muted-foreground hover:text-foreground transition-colors">Portfolio</Link>
          <Link to="/" hash="testimonials" className="story-link text-muted-foreground hover:text-foreground transition-colors">Testimonials</Link>
          <Link to="/" hash="book" className="story-link text-muted-foreground hover:text-foreground transition-colors">Book</Link>
          <Link to="/" hash="contact" className="story-link text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="story-link text-imperium hover:text-imperium-glow transition-colors">Admin</Link>
              )}
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
        <Link
          to="/"
          hash="book"
          className="hidden md:inline-flex h-9 items-center border border-foreground px-4 font-mono text-[11px] uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-colors"
        >
          Book Consultation
        </Link>
      </div>
    </header>
  );
}

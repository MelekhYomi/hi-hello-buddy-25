import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-2xl text-imperium leading-none">C</span>
          <span className="font-display text-xl tracking-wider">IMPERIUM</span>
        </Link>
        <nav className="hidden items-center gap-8 text-xs font-mono uppercase tracking-[0.2em] md:flex">
          <a href="#services" className="story-link text-muted-foreground hover:text-foreground transition-colors">Services</a>
          <a href="#portfolio" className="story-link text-muted-foreground hover:text-foreground transition-colors">Portfolio</a>
          <a href="#testimonials" className="story-link text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
          <a href="#book" className="story-link text-muted-foreground hover:text-foreground transition-colors">Book</a>
          <a href="#contact" className="story-link text-muted-foreground hover:text-foreground transition-colors">Contact</a>
        </nav>
        <a
          href="#book"
          className="hidden md:inline-flex h-9 items-center border border-foreground px-4 font-mono text-[11px] uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-colors"
        >
          Book Consultation
        </a>
      </div>
    </header>
  );
}

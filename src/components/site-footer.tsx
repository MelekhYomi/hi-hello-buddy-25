import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-ink py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <span className="font-display text-2xl text-imperium leading-none transition-transform group-hover:scale-110">C</span>
              <span className="font-display text-xl tracking-wider transition-colors group-hover:text-imperium">IMPERIUM</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed">
              Design. Branding. Print. Web. Building brands that command attention — from Jos,
              Nigeria to the global stage.
            </p>
            <div className="mt-6 flex items-center gap-5 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              <a href="https://instagram.com/cimperiumbranding" target="_blank" rel="noopener noreferrer" className="hover:text-imperium transition-colors">Instagram</a>
              <span className="h-1 w-1 rounded-full bg-imperium/60" />
              <a href="https://linkedin.com/company/cimperium" target="_blank" rel="noopener noreferrer" className="hover:text-imperium transition-colors">LinkedIn</a>
              <span className="h-1 w-1 rounded-full bg-imperium/60" />
              <a href="https://behance.net/cimperium" target="_blank" rel="noopener noreferrer" className="hover:text-imperium transition-colors">Behance</a>
            </div>
          </div>
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-[0.2em] text-imperium">Navigate</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><a href="#services" className="hover:text-foreground transition-colors">Services</a></li>
              <li><a href="#portfolio" className="hover:text-foreground transition-colors">Portfolio</a></li>
              <li><a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a></li>
              <li><a href="#book" className="hover:text-foreground transition-colors">Book Now</a></li>
              <li><a href="#contact" className="hover:text-foreground transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-[0.2em] text-imperium">Reach Us</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>Jos, Plateau State</li>
              <li>Nigeria</li>
              <li><a href="mailto:hello@cimperium.com" className="hover:text-foreground transition-colors">hello@cimperium.com</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground md:flex-row">
          <span>Crafted in Jos, Nigeria</span>
          <span>© {new Date().getFullYear()} C Imperium Branding</span>
          <a href="#top" className="hover:text-foreground transition-colors">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}

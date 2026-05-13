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
              Building brands that command attention. From Jos, Nigeria to the global stage —
              we transform businesses into market leaders through strategic design and world-class execution.
            </p>
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

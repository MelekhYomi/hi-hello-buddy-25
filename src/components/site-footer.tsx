import { Link } from "@tanstack/react-router";
import { useSiteSettings } from "@/lib/site-settings";

const DEFAULT_FOOTER = {
  tagline:
    "Design. Branding. Print. Web. Building brands that command attention — from Jos, Nigeria to the global stage.",
  address_line1: "Jos, Plateau State",
  address_line2: "Nigeria",
  copyright: "© 2026 C Imperium Branding",
};

const DEFAULT_SOCIALS = {
  instagram: "https://instagram.com/cimperiumbranding",
  linkedin: "https://linkedin.com/company/cimperium",
  behance: "https://behance.net/cimperium",
};

export function SiteFooter() {
  const { data: settings } = useSiteSettings();
  const s = settings as Record<string, unknown> | undefined;
  const footer = { ...DEFAULT_FOOTER, ...((s?.footer as Partial<typeof DEFAULT_FOOTER>) ?? {}) };
  const socials = { ...DEFAULT_SOCIALS, ...((s?.socials as Partial<typeof DEFAULT_SOCIALS>) ?? {}) };
  const email = (s?.contact_email as string | undefined) ?? "hello@cimperium.com";

  return (
    <footer className="border-t border-border/40 bg-ink py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <span className="font-display text-2xl text-imperium leading-none transition-transform group-hover:scale-110">C</span>
              <span className="font-display text-xl tracking-wider transition-colors group-hover:text-imperium">IMPERIUM</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed">{footer.tagline}</p>
            <div className="mt-6 flex items-center gap-5 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              {socials.instagram && <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-imperium transition-colors">Instagram</a>}
              {socials.linkedin && <><span className="h-1 w-1 rounded-full bg-imperium/60" /><a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-imperium transition-colors">LinkedIn</a></>}
              {socials.behance && <><span className="h-1 w-1 rounded-full bg-imperium/60" /><a href={socials.behance} target="_blank" rel="noopener noreferrer" className="hover:text-imperium transition-colors">Behance</a></>}
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
              <li>{footer.address_line1}</li>
              <li>{footer.address_line2}</li>
              <li><a href={`mailto:${email}`} className="hover:text-foreground transition-colors">{email}</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground md:flex-row">
          <span>Crafted in Jos, Nigeria</span>
          <span>{footer.copyright}</span>
          <a href="#top" className="hover:text-foreground transition-colors">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}

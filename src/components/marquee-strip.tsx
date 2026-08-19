import kavaro from "@/assets/clients/kavaro.png";
import lumera from "@/assets/clients/lumera.png";
import norvek from "@/assets/clients/norvek.png";
import vanta from "@/assets/clients/vanta.png";
import zentriq from "@/assets/clients/zentriq.png";

const LOGOS: { src: string; name: string }[] = [
  { src: norvek, name: "Norvek" },
  { src: lumera, name: "Lumera" },
  { src: zentriq, name: "Zenttriq" },
  { src: kavaro, name: "Kavaro" },
  { src: vanta, name: "Vantia Co" },
];

export function MarqueeStrip() {
  const loop = [...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS];
  return (
    <section aria-label="Brands we have worked with" className="relative z-[2] border-y border-border/60 bg-ink py-8">
      <p className="mb-6 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        Brands we&apos;ve worked with
      </p>
      <div className="relative overflow-hidden">
        <div className="flex w-max animate-[ci-marquee_30s_linear_infinite] items-center">
          {loop.map((l, i) => (
            <div key={`${l.name}-${i}`} className="flex shrink-0 items-center px-10">
              <img
                src={l.src}
                alt={`${l.name} logo`}
                loading="lazy"
                width={512}
                height={512}
                className="h-12 w-auto max-w-[160px] object-contain opacity-60 invert transition-opacity duration-300 hover:opacity-100 md:h-14"
              />
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-ink to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-ink to-transparent" />
      </div>
    </section>
  );
}

import moniepoint from "@/assets/clients/moniepoint.png";
import zenithBank from "@/assets/clients/zenith-bank.png";
import igniteHouse from "@/assets/clients/ignite-house.png";
import chakkamRent from "@/assets/clients/chakkamrent.png";
import thinqSummit from "@/assets/clients/thinq-summit.png";
import viverscuisines from "@/assets/clients/viverscuisines.png";
import umaneGlobal from "@/assets/clients/umane-global.png";
import poundwise from "@/assets/clients/poundwise.png";
import maynovaGlobal from "@/assets/clients/maynova-global.png";
import valueForge from "@/assets/clients/value-forge.png";
import icicHeritage from "@/assets/clients/icic-heritage.png";
import nexusProMedia from "@/assets/clients/nexus-pro-media.png";
import blackUnboxMedia from "@/assets/clients/black-unbox-media.png";
import sketchfinix from "@/assets/clients/sketchfinix.svg";
import jemimahAdove from "@/assets/clients/jemimah-adove.png";

// 15 of 22 confirmed client logos wired in. Still pending logo files for:
// New Covenant Church, Plateau State Government, Jolex Construction Company,
// Spring Foundation, Kaylztech, Worshippers City, Wasiku.
const LOGOS: { src: string; name: string }[] = [
  { src: moniepoint, name: "Moniepoint" },
  { src: zenithBank, name: "Zenith Bank" },
  { src: igniteHouse, name: "Ignite House" },
  { src: chakkamRent, name: "ChakkamRent" },
  { src: thinqSummit, name: "ThinQ Summit Nigeria" },
  { src: viverscuisines, name: "Viverscuisines" },
  { src: umaneGlobal, name: "Umane Global" },
  { src: poundwise, name: "Poundwise" },
  { src: maynovaGlobal, name: "Maynova Global" },
  { src: valueForge, name: "Value Forge" },
  { src: icicHeritage, name: "ICIC Heritage" },
  { src: nexusProMedia, name: "Nexus Pro Media" },
  { src: blackUnboxMedia, name: "Black Unbox Media" },
  { src: sketchfinix, name: "Sketchfinix" },
  { src: jemimahAdove, name: "Jemimah Adove" },
];

export function MarqueeStrip() {
  const loop = [...LOGOS, ...LOGOS, ...LOGOS];
  return (
    <section aria-label="Brands we have worked with" className="relative z-[2] bg-ink py-6">
      <p className="mb-4 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        Brands we&apos;ve worked with
      </p>
      <div className="relative overflow-hidden">
        <div className="flex w-max animate-[ci-marquee_45s_linear_infinite] items-stretch gap-4">
          {loop.map((l, i) => (
            <div
              key={`${l.name}-${i}`}
              className="flex shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-8 py-5 transition-colors duration-300 hover:border-imperium/40"
            >
              <img
                src={l.src}
                alt={`${l.name} logo`}
                loading="lazy"
                // Force every logo to a solid-white silhouette regardless of its
                // original colors (brightness(0) flattens to black, invert(1)
                // flips to white) — keeps mixed dark/colored/white source logos
                // uniformly legible against the dark strip.
                style={{ filter: "brightness(0) invert(1)" }}
                className="h-11 w-auto max-w-[150px] object-contain opacity-75 transition-opacity duration-300 hover:opacity-100 md:h-12"
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

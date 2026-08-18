const ITEMS = [
  "Brand Identity",
  "Print & Packaging",
  "Web Development",
  "Social Media",
  "Brand Strategy",
  "Creative Direction",
  "Outdoor Branding",
  "Stand Out. Dominate.",
];

export function MarqueeStrip() {
  const loop = [...ITEMS, ...ITEMS];
  return (
    <div className="relative z-[2] overflow-hidden bg-imperium py-3">
      <div className="flex animate-[ci-marquee_22s_linear_infinite] whitespace-nowrap">
        {loop.map((t, i) => (
          <span
            key={i}
            className="flex items-center gap-8 px-8 font-display text-base tracking-[0.1em] text-charleston"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            {t}
            <span className="text-xs">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

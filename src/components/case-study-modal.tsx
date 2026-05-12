import { useEffect } from "react";
import { X, ArrowRight, Building2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type CaseStudy = Database["public"]["Tables"]["case_studies"]["Row"];

export function CaseStudyModal({
  study,
  onClose,
}: {
  study: CaseStudy | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!study) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [study, onClose]);

  if (!study) return null;

  const gallery =
    study.gallery_images && study.gallery_images.length
      ? study.gallery_images
      : study.cover_image
        ? [study.cover_image]
        : [];
  const marqueeImages = gallery.length ? [...gallery, ...gallery] : [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${study.title} case study`}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur transition-colors hover:bg-foreground hover:text-charleston"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Marquee banner */}
        {marqueeImages.length > 0 && (
          <div className="relative overflow-hidden border-b border-border bg-ink">
            <div className="flex w-max marquee-track">
              {marqueeImages.map((src, i) => (
                <div
                  key={`${src}-${i}`}
                  className="relative h-64 w-[420px] shrink-0 md:h-80 md:w-[560px]"
                >
                  <img
                    src={src}
                    alt={`${study.title} visual ${i + 1}`}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background/30" />
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-card to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-card to-transparent" />
          </div>
        )}

        <div className="p-6 md:p-10">
          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-imperium">
            <span>{study.industry}</span>
            <span className="h-px w-6 bg-imperium" />
            <span className="text-muted-foreground">{study.client}</span>
          </div>

          <h2 className="mt-3 font-display text-4xl leading-tight md:text-5xl">
            {study.title}
          </h2>

          <div className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4 text-imperium" /> {study.client}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Block label="Challenge" body={study.challenge} />
            <Block label="Solution" body={study.solution} />
            <Block label="Results" body={study.results} />
          </div>

          <a
            href="#book"
            onClick={onClose}
            className="btn-cta mt-10 inline-flex h-12 px-8"
          >
            Start a similar project <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

function Block({ label, body }: { label: string; body: string | null }) {
  if (!body) return null;
  return (
    <div className="border-l-2 border-imperium pl-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-imperium">
        {label}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-foreground/90">{body}</p>
    </div>
  );
}

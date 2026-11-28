import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, Paperclip, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings, cleanWaNumber } from "@/lib/site-settings";
import type { Json } from "@/integrations/supabase/types";

/**
 * The project brief, built into the site with the same questions as the two
 * Google Forms ("BRAND IDENTITY SYSTEM" and "CLIENT PURCHASE ORDER") so
 * customers never leave cimperiumbrand.com. Answers are stored as JSON in
 * `service_briefs`; a single reference file goes to the `service-briefs`
 * bucket.
 */

type ChoiceKind = "radio" | "check";

type Field =
  | {
      kind: "input";
      name: string;
      label: string;
      type?: "text" | "email" | "tel" | "date";
      required?: boolean;
      placeholder?: string;
    }
  | { kind: "area"; name: string; label: string; required?: boolean; placeholder?: string }
  | {
      kind: "choice";
      name: string;
      label: string;
      options: readonly string[];
      choice: ChoiceKind;
      required?: boolean;
      /** Adds an "Other" option with a follow-up text box (as Google's Other: does). */
      allowOther?: boolean;
    }
  | { kind: "file"; name: string; label: string; required?: boolean }
  | { kind: "confirm"; name: string; label: string; required?: boolean }
  | { kind: "note"; text: string };

type Section = { title: string; fields: Field[] };

type FormSpec = { eyebrow: string; title: string; welcome: string; sections: Section[] };

type AnswerValue = string | string[] | boolean;
type Answers = Record<string, AnswerValue>;

const inputClass =
  "w-full rounded-md border border-border bg-card/60 px-4 py-3 text-base outline-none focus:border-imperium md:text-sm";

const MAX_FILE_BYTES = 100 * 1024 * 1024; // matches the Google Forms' 100 MB cap

/* ------------------------------------------------------------------ */
/* Brand Identity System brief                                         */
/* ------------------------------------------------------------------ */

const BRAND_PERSONALITY = [
  "FRIENDLY",
  "PROFESSIONAL",
  "LUXURIOUS",
  "PLAYFUL",
  "BOLD",
  "INNOVATIVE",
  "TRUSTWORTHY",
  "MINIMALIST",
  "REBELLIOUS",
] as const;

const BRAND_PLACEMENT = [
  "WEBSITE",
  "SOCIAL MEDIA",
  "PRODUCT PACKAGING",
  "STATIONERY",
  "ADs",
  "MERCHANDISE",
] as const;

const BRAND_BRIEF: FormSpec = {
  eyebrow: "Step 2 — your brief",
  title: "BRAND IDENTITY SYSTEM",
  welcome:
    "Welcome to C-Imperium Branding! This form helps us understand your brand from the inside out. Kindly fill it out with as much detail as possible so we can craft a brand identity system that's authentic, strategic, and unforgettable.",
  sections: [
    {
      title: "YOUR DETAILS",
      fields: [
        { kind: "input", name: "businessName", label: "BUSINESS NAME", required: true },
        { kind: "input", name: "tagline", label: "TAGLINE / SLOGAN ( IF ANY )", required: true, placeholder: "e.g. Powering every home" },
        { kind: "input", name: "contactRole", label: "PRIMARY CONTACT NAME AND ROLE", required: true, placeholder: "e.g. Ada Obi — Founder" },
        { kind: "input", name: "email", label: "EMAIL", type: "email", required: true },
        { kind: "input", name: "phone", label: "PHONE NUMBER", type: "tel", required: true },
        { kind: "input", name: "socialHandles", label: "SOCIAL MEDIA HANDLES", required: true, placeholder: "@yourhandle on Instagram, X, TikTok…" },
      ],
    },
    {
      title: "YOUR BRAND FOUNDATION",
      fields: [
        { kind: "area", name: "mission", label: "BRAND'S MISSION", required: true },
        { kind: "area", name: "vision", label: "BRAND'S VISION", required: true },
        { kind: "area", name: "coreValues", label: "CORE VALUES", required: true, placeholder: "e.g. Integrity, Craftsmanship, Speed" },
        {
          kind: "choice",
          name: "personality",
          label: "Select the words that best describe your brand's personality.",
          options: BRAND_PERSONALITY,
          choice: "check",
          required: true,
        },
        { kind: "area", name: "story", label: "WHAT IS YOUR BRAND'S STORY OR BACKGROUND?", required: true },
      ],
    },
    {
      title: "YOUR AUDIENCE",
      fields: [
        { kind: "area", name: "targetAudience", label: "WHO ARE YOUR TARGET AUDIENCE?", required: true },
        { kind: "area", name: "demographics", label: "CUSTOMER DEMOGRAPHICS ( AGE, LOCATION, INCOME, GENDER)", required: true },
        { kind: "area", name: "psychographics", label: "CUSTOMER PSYCHOGRAPHICS ( VALUES, INTERESTS, CHALLENGES, LIFESTYLE )", required: true },
        { kind: "area", name: "problems", label: "WHAT PROBLEMS(S) DO YOU SOLVE FOR YOUR CUSTOMERS?", required: true },
        { kind: "area", name: "competitors", label: "WHO ARE YOUR MAIN COMPETITORS?", required: true },
        { kind: "area", name: "usp", label: "WHAT MAKES YOUR BRAND DIFFERENT OR BETTER? (USP – UNIQUE SELLING PROPOSITION)", required: true },
        { kind: "area", name: "desiredFeeling", label: "WHAT DO YOU WANT PEOPLE TO FEEL OR THINK WHEN THEY INTERACT WITH YOUR BRAND?", required: true },
      ],
    },
    {
      title: "LOOK & FEEL",
      fields: [
        {
          kind: "choice",
          name: "existingVisuals",
          label: "DO YOU HAVE EXISTING BRAND VISUALS ( LOGO, COLORS, TYPOGRAPHY )?",
          options: ["YES", "NO", "PARTIALLY"],
          choice: "radio",
          required: true,
        },
        { kind: "file", name: "existingAssets", label: "IF YES, KINDLY UPLOAD YOUR EXISTING BRAND ASSETS." },
        { kind: "input", name: "preferredColours", label: "PREFERRED COLOURS TO BE USED FOR YOUR BRAND", required: true, placeholder: "e.g. Deep green, gold, off-white" },
        { kind: "input", name: "avoidedColours", label: "WHAT COLOURS SHOULD BE AVOIDED?", required: true },
        { kind: "input", name: "typography", label: "WHAT TYPOGRAPHY OR FONT STYLES DO YOU PREFER? ( SERIF, SANS-SERIF, HANDWRITTEN )", required: true },
        { kind: "area", name: "admiredBrands", label: "LIST 3-5 BRANDS YOU ADMIRE FOR THEIR VISUAL IDENTITY AND WHY.", required: true },
        { kind: "input", name: "moodBoard", label: "ANY MOOD BOARD OR INSPIRATION LINKS YOU'D LIKE TO SHARE?", required: true, placeholder: "Paste links, separated by commas" },
      ],
    },
    {
      title: "VOICE & PLACEMENT",
      fields: [
        {
          kind: "choice",
          name: "voice",
          label: "IF YOUR BRAND COULD SPEAK, HOW WOULD IT SOUND?",
          options: ["FORMAL", "CASUAL", "INSPIRING", "WITTY"],
          choice: "radio",
          required: true,
        },
        {
          kind: "choice",
          name: "placement",
          label: "WHERE WILL YOUR BRANDING PRIMARILY APPEAR?",
          options: BRAND_PLACEMENT,
          choice: "check",
          required: true,
          allowOther: true,
        },
        {
          kind: "choice",
          name: "styleGuide",
          label: "DO YOU NEED A BRAND STYLE GUIDE/MANUAL?",
          options: ["YES", "NO", "NOT SURE"],
          choice: "radio",
          required: true,
        },
      ],
    },
    {
      title: "TIMELINE & NEXT STEPS",
      fields: [
        { kind: "input", name: "launchDate", label: "DO YOU HAVE UPCOMING DEADLINES OR A LAUNCH DATE?", type: "date", required: true },
        { kind: "area", name: "anythingElse", label: "IS THERE ANYTHING ELSE WE SHOULD KNOW ABOUT YOUR BRAND?", required: true },
        {
          kind: "choice",
          name: "strategySession",
          label: "WOULD YOU LIKE TO SCHEDULE A BRAND STRATEGY SESSION?",
          options: ["YES", "NO", "MAYBE"],
          choice: "radio",
          required: true,
        },
        { kind: "input", name: "hearAbout", label: "HOW DID YOU HEAR ABOUT C-IMPERIUM BRANDING?", required: true },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Client Purchase Order (Print & Packaging)                           */
/* ------------------------------------------------------------------ */

const PURCHASE_ORDER: FormSpec = {
  eyebrow: "Client purchase order",
  title: "CLIENT PURCHASE ORDER",
  welcome:
    "Welcome to C Imperium — where your brand comes to life. Please fill out this order form carefully to help us process your print or design request accurately and efficiently. Once submitted, our team will review your order and get back to you shortly for confirmation and next steps.",
  sections: [
    {
      title: "YOUR DETAILS",
      fields: [
        { kind: "input", name: "companyName", label: "COMPANY OR BRAND NAME", required: true },
        { kind: "input", name: "email", label: "EMAIL", type: "email", required: true },
        { kind: "input", name: "address", label: "ADDRESS", required: true },
        { kind: "input", name: "phone", label: "PHONE NUMBER ( WhatsApp Preferred )", type: "tel", required: true },
        { kind: "input", name: "website", label: "WEBSITE OR SOCIAL MEDIA HANDLE" },
        { kind: "area", name: "business", label: "BRIEFLY DESCRIBE YOUR BUSINESS", required: true },
      ],
    },
    {
      title: "CONTACT & ORDER",
      fields: [
        {
          kind: "choice",
          name: "contactMethod",
          label: "PREFERRED CONTACT METHOD",
          options: ["Whatsapp", "Email", "Phone Call"],
          choice: "radio",
          required: true,
        },
        {
          kind: "choice",
          name: "orderType",
          label: "TYPE OF ORDER",
          options: ["Graphic Design", "Branding", "Printing", "Tech (Website / Digital)", "Social Media Management"],
          choice: "radio",
          required: true,
          allowOther: true,
        },
        {
          kind: "area",
          name: "orderDescription",
          label: "DESCRIBE YOUR ORDER",
          required: true,
          placeholder: "Example: Business card design and print (500 copies), size A6, full color.",
        },
        { kind: "input", name: "quantity", label: "QUANTITY/UNITS NEEDED", required: true },
        { kind: "input", name: "size", label: "SIZE OR DIMENSIONS ( IF APPLICABLE )", required: true },
        { kind: "input", name: "colourPreference", label: "COLOUR PREFERENCE / BRAND COLOURS", required: true },
      ],
    },
    {
      title: "FILES & DELIVERY",
      fields: [
        { kind: "file", name: "referenceFiles", label: "UPLOAD REFERENCE FILES OR LOGOS ( IF ANY )", required: true },
        { kind: "input", name: "deliveryDate", label: "PREFERRED DELIVERY DATE / DEADLINE", type: "date", required: true },
        {
          kind: "choice",
          name: "deliveryMethod",
          label: "DELIVERY METHOD",
          options: ["Pick-up at C Imperium Office", "Delivery (Additional charge applies)"],
          choice: "radio",
          required: true,
        },
        { kind: "input", name: "deliveryAddress", label: "DELIVERY ADDRESS ( IF APPLICABLE )", required: true },
      ],
    },
    {
      title: "PAYMENT & CONFIRMATION",
      fields: [
        {
          kind: "choice",
          name: "quotation",
          label: "WOULD YOU LIKE TO RECEIVE A QUOTATION BEFORE PAYMENT?",
          options: ["Yes, please send me a quotation/invoice.", "No, I already have a standing rate with C Imperium."],
          choice: "radio",
          required: true,
        },
        {
          kind: "choice",
          name: "paymentMethod",
          label: "PREFERRED PAYMENT METHOD",
          options: ["Bank Transfer", "Cash (At Office)", "Online Payment (Link)"],
          choice: "radio",
          required: true,
        },
        {
          kind: "note",
          text: "At C Imperium, payment validates your order. Once your order details are received, an official invoice will be sent to your preferred contact method. Production or design work begins immediately after payment confirmation.",
        },
        { kind: "area", name: "additionalNotes", label: "ANY ADDITIONAL NOTES OR SPECIAL REQUESTS?", required: true },
        {
          kind: "confirm",
          name: "confirmation",
          label: "I agree to the above terms and would like to proceed with my order.",
          required: true,
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export type BriefServiceSlug = "brand-identity" | "print-packaging";

export type ServiceBriefFormProps = {
  serviceSlug: BriefServiceSlug;
  /** Package bought, when the brief follows a payment (e.g. "Basic"). */
  packageName?: string;
  /** Paystack reference, when the brief follows a payment. */
  orderReference?: string;
};

function uuid(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function useWaLink() {
  const { data: settings } = useSiteSettings();
  const number = cleanWaNumber(settings?.whatsapp_number) || "2348038577654";
  return (message: string) => `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function ServiceBriefForm({ serviceSlug, packageName, orderReference }: ServiceBriefFormProps) {
  const spec = serviceSlug === "brand-identity" ? BRAND_BRIEF : PURCHASE_ORDER;
  const wa = useWaLink();

  const [answers, setAnswers] = useState<Answers>({});
  const [others, setOthers] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const [reference, setReference] = useState("");

  const setValue = (name: string, value: AnswerValue) =>
    setAnswers((prev) => ({ ...prev, [name]: value }));

  const toggleChoice = (name: string, option: string) =>
    setAnswers((prev) => {
      const current = prev[name];
      const list = Array.isArray(current) ? current : [];
      const next = list.includes(option) ? list.filter((o) => o !== option) : [...list, option];
      return { ...prev, [name]: next };
    });

  const chosen = (field: Extract<Field, { kind: "choice" }>): string[] => {
    const v = answers[field.name];
    if (Array.isArray(v)) return v;
    return typeof v === "string" && v ? [v] : [];
  };

  const otherWanted = (field: Extract<Field, { kind: "choice" }>): boolean =>
    Boolean(field.allowOther) && chosen(field).includes("Other");

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    for (const section of spec.sections) {
      for (const field of section.fields) {
        if (!("name" in field)) continue;
        if (!field.required) continue;
        const value = answers[field.name];
        if (field.kind === "file") {
          if (!file) errs[field.name] = "Please attach a file.";
        } else if (field.kind === "confirm") {
          if (value !== true) errs[field.name] = "Please confirm to continue.";
        } else if (field.kind === "choice") {
          const picked = chosen(field);
          if (picked.length === 0) errs[field.name] = "Please choose an option.";
          else if (otherWanted(field) && !others[field.name]?.trim())
            errs[field.name] = "Please tell us what “Other” means.";
        } else if (typeof value !== "string" || !value.trim()) {
          errs[field.name] = "This question is required.";
        }
      }
    }
    return errs;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const found = validate();
    setErrors(found);
    setServerError("");
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(first)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setBusy(true);
    try {
      const briefId = uuid();
      const stored: Json[] = [];

      if (file) {
        const fileField = spec.sections
          .flatMap((s) => s.fields)
          .find((f): f is Extract<Field, { kind: "file" }> => f.kind === "file");
        const safeName = file.name.replace(/[^\w.\-]+/g, "-");
        const path = `${serviceSlug}/${briefId}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from("service-briefs")
          .upload(path, file, { upsert: false, contentType: file.type || undefined });
        if (upErr) {
          // Only nudge about file size when that's actually the problem.
          const hint = /too large|exceed|size/i.test(upErr.message) ? " Please try a smaller file." : "";
          throw new Error(`We couldn't upload ${file.name}: ${upErr.message}.${hint}`);
        }
        stored.push({ field: fileField?.label ?? "Attachment", name: file.name, path });
      }

      // Merge the "Other" follow-ups into the answers under their own key.
      const merged: Answers = { ...answers };
      for (const [name, text] of Object.entries(others)) if (text.trim()) merged[`${name}_other`] = text.trim();

      // No .select(): inserts with return=minimal, so anon needs no read policy.
      const { error: insErr } = await supabase.from("service_briefs").insert({
        id: briefId,
        service_slug: serviceSlug,
        package_name: packageName ?? null,
        order_reference: orderReference ?? null,
        answers: merged as unknown as Json,
        files: stored as unknown as Json,
      });
      if (insErr) throw new Error(insErr.message);

      setReference(`CI-BRF-${briefId.replace(/-/g, "").slice(0, 8).toUpperCase()}`);
      setFile(null);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  /* ---- Success ---- */
  if (reference) {
    return (
      <div className="rounded-lg border border-imperium/40 bg-card p-6 text-center md:p-8">
        <CheckCircle2 className="mx-auto h-14 w-14 text-imperium" />
        <h2 className="mt-4 font-display text-3xl md:text-4xl">BRIEF RECEIVED.</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Thank you — your {spec.title.toLowerCase()} is with our team. We'll review it and get back to
          you shortly for confirmation and next steps.
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          Your reference: <span className="font-mono text-foreground">{reference}</span>
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <a
            href={wa(`Hi C Imperium, I just submitted my brief. Reference: ${reference}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cta h-12 px-8"
          >
            Message us on WhatsApp
          </a>
          <Link
            to="/services/$slug"
            params={{ slug: serviceSlug }}
            className="inline-flex h-12 items-center border border-border px-8 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:border-imperium hover:text-imperium"
          >
            Back to the service
          </Link>
        </div>
      </div>
    );
  }

  /* ---- Form ---- */
  return (
    <div className="rounded-lg border border-imperium/40 bg-card p-6 md:p-8">
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-imperium">{spec.eyebrow}</span>
      <h2 className="mt-2 font-display text-2xl md:text-3xl">{spec.title}</h2>
      <div className="mt-2 h-px w-20 bg-imperium" />
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{spec.welcome}</p>
      {orderReference && (
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Order reference: <span className="text-imperium">{orderReference.slice(0, 12)}</span>
        </p>
      )}

      <form onSubmit={submit} noValidate className="mt-8 space-y-9">
        {spec.sections.map((section) => (
          <section key={section.title}>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.28em] text-imperium">{section.title}</h3>
            <div className="mt-4 space-y-5">
              {section.fields.map((field, i) => (
                <FieldView
                  key={"name" in field ? field.name : `note-${i}`}
                  field={field}
                  value={"name" in field ? answers[field.name] : undefined}
                  otherValue={"name" in field ? (others[field.name] ?? "") : ""}
                  error={"name" in field ? errors[field.name] : undefined}
                  file={field.kind === "file" ? file : undefined}
                  onValue={setValue}
                  onToggle={toggleChoice}
                  onOther={(name, text) => setOthers((prev) => ({ ...prev, [name]: text }))}
                  onFile={(f) => {
                    setFile(f);
                    setErrors((prev) => {
                      if (!f) return prev;
                      const next = { ...prev };
                      if (field.kind === "file") delete next[field.name];
                      return next;
                    });
                  }}
                />
              ))}
            </div>
          </section>
        ))}

        {serverError && (
          <p className="flex items-start gap-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn-cta flex h-14 w-full items-center justify-center gap-2 disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending your brief…
            </>
          ) : (
            <>
              Submit brief <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Prefer to talk it through?{" "}
          <a
            href={wa("Hi C Imperium, I have a question about my project brief.")}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-imperium"
          >
            Message us on WhatsApp
          </a>
        </p>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Field rendering                                                     */
/* ------------------------------------------------------------------ */

function FieldView({
  field,
  value,
  otherValue,
  error,
  file,
  onValue,
  onToggle,
  onOther,
  onFile,
}: {
  field: Field;
  value: AnswerValue | undefined;
  otherValue: string;
  error: string | undefined;
  file?: File | null;
  onValue: (name: string, value: AnswerValue) => void;
  onToggle: (name: string, option: string) => void;
  onOther: (name: string, text: string) => void;
  onFile: (file: File | null) => void;
}) {
  if (field.kind === "note") {
    return (
      <div className="border-l-2 border-imperium bg-imperium/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        {field.text}
      </div>
    );
  }

  const label =
    field.kind === "confirm" ? null : (
      <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {field.label}
        {"required" in field && field.required && <span className="text-imperium"> *</span>}
      </span>
    );

  const err = error ? <p className="mt-1.5 text-xs text-destructive">{error}</p> : null;
  const box = error ? `${inputClass} border-destructive` : inputClass;

  if (field.kind === "input") {
    return (
      <div id={field.name}>
        {label}
        <input
          type={field.type ?? "text"}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onValue(field.name, e.target.value)}
          placeholder={field.placeholder}
          autoComplete={field.type === "email" ? "email" : field.type === "tel" ? "tel" : "on"}
          className={box}
        />
        {err}
      </div>
    );
  }

  if (field.kind === "area") {
    return (
      <div id={field.name}>
        {label}
        <textarea
          rows={3}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onValue(field.name, e.target.value)}
          placeholder={field.placeholder}
          className={`${box} min-h-[96px] resize-y`}
        />
        {err}
      </div>
    );
  }

  if (field.kind === "choice") {
    const picked = Array.isArray(value) ? value : typeof value === "string" && value ? [value] : [];
    const options = field.allowOther ? [...field.options, "Other"] : field.options;
    const wantOther = field.allowOther && picked.includes("Other");
    const multi = field.choice === "check";

    return (
      <div id={field.name}>
        {label}
        <div className={`grid gap-2 ${multi ? "sm:grid-cols-2 md:grid-cols-3" : "sm:grid-cols-2"}`}>
          {options.map((opt) => {
            const checked = picked.includes(opt);
            return (
              <label
                key={opt}
                className={`flex cursor-pointer items-start gap-3 border px-4 py-3 transition-colors ${
                  checked ? "border-imperium bg-imperium/10" : "border-border/60 hover:border-imperium/50"
                }`}
              >
                <input
                  type={multi ? "checkbox" : "radio"}
                  name={`${field.name}${multi ? "" : "-radio"}`}
                  checked={checked}
                  onChange={() => onToggle(field.name, opt)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-imperium"
                />
                <span className="text-sm leading-snug">{opt}</span>
              </label>
            );
          })}
        </div>
        {wantOther && (
          <input
            value={otherValue}
            onChange={(e) => onOther(field.name, e.target.value)}
            placeholder="Please specify"
            className={`${box} mt-2`}
          />
        )}
        {err}
      </div>
    );
  }

  if (field.kind === "file") {
    return (
      <div id={field.name}>
        {label}
        {file ? (
          <div className="flex items-center justify-between gap-3 border border-imperium/40 bg-imperium/10 px-4 py-3">
            <span className="flex min-w-0 items-center gap-2 text-sm">
              <Paperclip className="h-4 w-4 shrink-0 text-imperium" />
              <span className="truncate">{file.name}</span>
            </span>
            <button
              type="button"
              onClick={() => onFile(null)}
              aria-label="Remove file"
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label
            className={`flex cursor-pointer items-center gap-2 border border-dashed px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-imperium hover:text-foreground ${
              error ? "border-destructive" : "border-border/60"
            }`}
          >
            <Paperclip className="h-4 w-4" />
            Choose a file — max 100 MB
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (f && f.size > MAX_FILE_BYTES) {
                  onFile(null);
                  e.target.value = "";
                  alert("That file is over 100 MB. Please choose a smaller file.");
                  return;
                }
                onFile(f);
              }}
            />
          </label>
        )}
        {err}
      </div>
    );
  }

  // confirm
  return (
    <div id={field.name}>
      <label
        className={`flex cursor-pointer items-start gap-3 border px-4 py-3 transition-colors ${
          value === true ? "border-imperium bg-imperium/10" : error ? "border-destructive" : "border-border/60"
        }`}
      >
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => onValue(field.name, e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-imperium"
        />
        <span className="text-sm leading-snug">{field.label}</span>
      </label>
      {err}
    </div>
  );
}

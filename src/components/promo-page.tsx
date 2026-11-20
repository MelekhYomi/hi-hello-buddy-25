import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { IDEA_TO_BRAND_SLUG, type PromoPage, type Promotion } from "@/lib/promotions-defaults";
import { Idea2BrandPay } from "@/components/idea2brand-pay";

/** FAQPage markup from the page's questions. Answers that still contain a [placeholder] are left out until filled in. */
export function faqSchema(faq: PromoPage["faq"]) {
  const ready = faq.filter((f) => f.q.trim() && f.a.trim() && !/\[[^\]]+\]/.test(f.a));
  if (ready.length === 0) return [];
  return [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: ready.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a.replace(/\*\*/g, "") },
      })),
    },
  ];
}

/**
 * Inline text: **bold**, and [square brackets] = a placeholder that shows highlighted
 * until the admin replaces it with the real detail.
 */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\])/g).filter(Boolean);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : part.startsWith("[") ? (
          <span key={i} className="ph">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/** "Idea to *Brand* 2027": words between asterisks get the yellow underline. */
function Headline({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("*") ? <span key={i}>{part.slice(1, -1)}</span> : <span key={i}>{part}</span>,
      )}
    </>
  );
}

function CopyRow({ value }: { value: string }) {
  const [label, setLabel] = useState("Copy");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setLabel("Copied");
    } catch {
      setLabel("Select it");
    }
    setTimeout(() => setLabel("Copy"), 1400);
  };
  return (
    <div>
      <span>{value}</span>
      <button type="button" onClick={copy}>{label}</button>
    </div>
  );
}

function Section({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return <section id={id} className={className}>{children}</section>;
}

/** The sticky promo bar and the small footer, shared by the landing page and the join-cohort screen. */
export function PromoShell({ children, cta }: { children: ReactNode; cta?: string }) {
  return (
    <div className="promo">
      <header className="nav">
        <div className="wrap">
          <Link to="/" className="logo" title="Back to cimperiumbrand.com"><img src="/icon-192.png" alt="C Imperium mark" width={30} height={30} />IMPERIUM</Link>
          {cta && <a className="btn" href="#reserve">{cta}</a>}
        </div>
      </header>
      {children}
      <footer>
        <div className="wrap">
          <span>C Imperium · No. 4, Boulevard Road, Shop 2, Jolex Plaza, Jos, Plateau State</span>
          <span><Link to="/">← Back to cimperiumbrand.com</Link> · Stand out. Dominate.</span>
        </div>
      </footer>
    </div>
  );
}

export function PromoPageView({ promo }: { promo: Promotion }) {
  const p: PromoPage = promo.page;
  const wa = `https://wa.me/${p.whatsapp_number.replace(/\D/g, "")}?text=${encodeURIComponent(p.whatsapp_message)}`;
  const hasSteps = p.steps.length > 0;
  const isIdeaToBrand = promo.slug === IDEA_TO_BRAND_SLUG;

  return (
    <PromoShell cta={p.cta_primary}>
      <main id="top">
        <Section className="hero">
          <div className="wrap">
            <div>
              {p.pill && <span className="pill">{p.pill}</span>}
              <h1><Headline text={p.headline || promo.title} /></h1>
              {p.lead && <p className="lead"><Rich text={p.lead} /></p>}
              <div className="cta">
                <a className="btn" href="#reserve">{p.cta_primary} <span aria-hidden="true">→</span></a>
                {hasSteps && p.cta_secondary && <a className="btn line" href="#steps">{p.cta_secondary}</a>}
              </div>
            </div>
            {p.details.length > 0 && (
              <aside className="details" aria-label="Details">
                {p.details.map((d, i) => (
                  <div className="row" key={i}>
                    <small>{d.label}</small>
                    <b className={/^\[.*\]$/.test(d.value.trim()) ? "ph" : undefined}>{d.value}</b>
                  </div>
                ))}
              </aside>
            )}
          </div>
        </Section>

        {p.outcomes.length > 0 && (
          <Section>
            <div className="wrap">
              {p.outcomes_kicker && <span className="kicker">{p.outcomes_kicker}</span>}
              {p.outcomes_title && <h2 className="sec-title">{p.outcomes_title}</h2>}
              <div className="cards3">
                {p.outcomes.map((o, i) => (
                  <article className="card" key={i}>
                    <div className="num">{i + 1}</div>
                    <h3>{o.title}</h3>
                    <p><Rich text={o.body} /></p>
                  </article>
                ))}
              </div>
              {p.outcomes_note && <p className="note"><Rich text={p.outcomes_note} /></p>}
            </div>
          </Section>
        )}

        {hasSteps && (
          <Section id="steps" className="steps-wrap">
            <div className="wrap">
              {p.steps_kicker && <span className="kicker">{p.steps_kicker}</span>}
              {p.steps_title && <h2 className="sec-title">{p.steps_title}</h2>}
              <div className="steps">
                {p.steps.map((s, i) => (
                  <div className="step" key={i}>
                    <div>
                      <h3>{s.title}</h3>
                      <p><Rich text={s.body} /></p>
                    </div>
                  </div>
                ))}
              </div>
              {p.steps_note && <p className="note"><Rich text={p.steps_note} /></p>}
            </div>
          </Section>
        )}

        {p.audience.length > 0 && (
          <Section className="band">
            <div className="wrap">
              {p.audience_kicker && <span className="kicker">{p.audience_kicker}</span>}
              {p.audience_title && <h2 className="sec-title">{p.audience_title}</h2>}
              <div className="who">
                {p.audience.map((a, i) => <div key={i}><Rich text={a} /></div>)}
              </div>
            </div>
          </Section>
        )}

        {p.faq.length > 0 && (
          <Section id="faq" className="faq">
            <div className="wrap">
              {p.faq_kicker && <span className="kicker">{p.faq_kicker}</span>}
              {p.faq_title && <h2 className="sec-title">{p.faq_title}</h2>}
              {p.faq.map((f, i) => (
                <details key={i}>
                  <summary>{f.q}</summary>
                  <p><Rich text={f.a} /></p>
                </details>
              ))}
            </div>
          </Section>
        )}

        <Section id="reserve" className="reserve">
          <div className="wrap">
            <div className="box">
              <div>
                <h2>{p.final_title || promo.title}</h2>
                {p.final_sub && <p className="sub">{p.final_sub}</p>}
                {isIdeaToBrand ? (
                  <Idea2BrandPay />
                ) : (
                  <a className="btn" href={wa} target="_blank" rel="noopener noreferrer">{p.button_label} <span aria-hidden="true">→</span></a>
                )}
              </div>
              {p.contacts.length > 0 && (
                <div className="contact">
                  {p.contacts.map((c, i) => <CopyRow key={i} value={c} />)}
                </div>
              )}
            </div>
          </div>
        </Section>
      </main>
    </PromoShell>
  );
}

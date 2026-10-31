import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { normalizePromotion } from "@/lib/queries";
import { EMPTY_PAGE, PROMO_ICONS, type Promotion, type PromoPage } from "@/lib/promotions-defaults";

const inp = "w-full rounded border border-border bg-card px-3 py-2 text-sm outline-none focus:border-imperium";
const btnGhost = "border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] hover:border-imperium";
const btnMini = "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground";

/** Every text value of a promotion, to find placeholders such as [Date] that still need a real detail. */
function allText(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(allText);
  if (value && typeof value === "object") return Object.values(value).flatMap(allText);
  return [];
}
export function countPlaceholders(p: Pick<Promotion, "tag" | "title" | "blurb" | "benefits" | "page">) {
  return allText(p).join("\n").match(/\[[^\]\n]+\]/g)?.length ?? 0;
}

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function invalidatePublic(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["admin-promotions"] });
  qc.invalidateQueries({ queryKey: ["promotions"] });
  qc.invalidateQueries({ queryKey: ["promotion"] });
}

export function PromotionsAdmin() {
  const qc = useQueryClient();
  const { data, error } = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("promotions").select("*").order("display_order");
      if (error) throw error;
      return data.map(normalizePromotion);
    },
  });
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [creating, setCreating] = useState(false);

  const remove = async (row: Promotion) => {
    if (!confirm(`Delete "${row.title}" and its page? This cannot be undone.`)) return;
    const { error } = await supabase.from("promotions").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); invalidatePublic(qc); }
  };
  const toggle = async (row: Promotion) => {
    const { error } = await supabase.from("promotions").update({ is_published: !row.is_published }).eq("id", row.id);
    if (error) toast.error(error.message);
    else invalidatePublic(qc);
  };

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Home page promotion cards and the page each one opens · lower order shows first
        </p>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex shrink-0 items-center gap-2 border border-imperium bg-imperium/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-imperium hover:bg-imperium hover:text-charleston"
        >
          <Plus className="h-3 w-3" /> Add promotion
        </button>
      </div>

      {error && (
        <div className="mb-4 border border-imperium/50 bg-imperium/10 p-4 text-sm">
          The promotions table is not set up yet. Run <code>supabase/migrations/20261031120000_promotions.sql</code> in the
          Supabase SQL Editor, then reload this page.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {data && data.length === 0 && (
          <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground md:col-span-2">No promotions yet</div>
        )}
        {data?.map((row) => {
          const open = countPlaceholders(row);
          return (
            <div key={row.id} className={cn("border border-border bg-card p-4", !row.is_published && "opacity-60")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-imperium">{row.tag}</div>
                  <div className="mt-1 font-display text-lg">{row.title}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    /promo/{row.slug} · #{row.display_order} · {row.is_published ? "Published" : "Hidden"}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{row.blurb}</p>
                  {open > 0 && (
                    <div className="mt-2 inline-block bg-imperium/15 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-imperium">
                      {open} placeholder{open === 1 ? "" : "s"} still to fill
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <a href={`/promo/${row.slug}`} target="_blank" rel="noopener" className={btnMini} title="Open the page">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <button onClick={() => toggle(row)} className={btnMini}>{row.is_published ? "Hide" : "Show"}</button>
                  <button onClick={() => setEditing(row)} className={btnMini} title="Edit"><Pencil className="h-3 w-3" /></button>
                  <button onClick={() => remove(row)} className={cn(btnMini, "hover:text-imperium")} title="Delete"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(editing || creating) && (
        <PromotionForm
          initial={editing}
          nextOrder={(data?.at(-1)?.display_order ?? 0) + 1}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); invalidatePublic(qc); }}
        />
      )}
    </div>
  );
}

// ---------- small form building blocks ----------

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="mt-6 border-t border-border pt-5">
      <legend className="pr-3 font-mono text-[10px] uppercase tracking-[0.25em] text-imperium">{title}</legend>
      {hint && <p className="mb-3 text-xs text-muted-foreground">{hint}</p>}
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}

function Label({ text, hint, children }: { text: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{text}</span>
      {hint && <span className="ml-2 text-[11px] normal-case tracking-normal text-muted-foreground/70">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

/** One line per item, for simple lists such as benefits or contact details. */
function Lines({ value, onChange, rows = 4 }: { value: string[]; onChange: (v: string[]) => void; rows?: number }) {
  const [text, setText] = useState(value.join("\n"));
  return (
    <textarea
      className={inp}
      rows={rows}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean));
      }}
    />
  );
}

/** A list of rows, each with two fields, that can be added, removed and moved. */
function Rows<T extends Record<string, string>>({
  value, onChange, fields, empty, addLabel,
}: {
  value: T[];
  onChange: (v: T[]) => void;
  fields: { key: keyof T & string; placeholder: string; long?: boolean }[];
  empty: T;
  addLabel: string;
}) {
  const move = (i: number, d: number) => {
    const next = [...value];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {value.map((row, i) => (
        <div key={i} className="flex gap-2 border border-border/70 bg-background/40 p-2">
          <div className="grid flex-1 gap-2">
            {fields.map((f) =>
              f.long ? (
                <textarea key={f.key} className={inp} rows={2} placeholder={f.placeholder} value={row[f.key]}
                  onChange={(e) => onChange(value.map((r, k) => (k === i ? { ...r, [f.key]: e.target.value } : r)))} />
              ) : (
                <input key={f.key} className={inp} placeholder={f.placeholder} value={row[f.key]}
                  onChange={(e) => onChange(value.map((r, k) => (k === i ? { ...r, [f.key]: e.target.value } : r)))} />
              ),
            )}
          </div>
          <div className="flex flex-col items-center gap-1">
            <button type="button" onClick={() => move(i, -1)} className={btnMini} title="Move up"><ArrowUp className="h-3 w-3" /></button>
            <button type="button" onClick={() => move(i, 1)} className={btnMini} title="Move down"><ArrowDown className="h-3 w-3" /></button>
            <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className={cn(btnMini, "hover:text-imperium")} title="Remove"><X className="h-3 w-3" /></button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, empty])} className={cn(btnGhost, "inline-flex items-center gap-2")}>
        <Plus className="h-3 w-3" /> {addLabel}
      </button>
    </div>
  );
}

// ---------- the editor ----------

function PromotionForm({
  initial, nextOrder, onClose, onSaved,
}: { initial: Promotion | null; nextOrder: number; onClose: () => void; onSaved: () => void }) {
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [tag, setTag] = useState(initial?.tag ?? "");
  const [blurb, setBlurb] = useState(initial?.blurb ?? "");
  const [benefits, setBenefits] = useState<string[]>(initial?.benefits ?? []);
  const [cardCta, setCardCta] = useState(initial?.card_cta ?? "Learn more");
  const [icon, setIcon] = useState(initial?.icon ?? "sparkles");
  const [order, setOrder] = useState(initial?.display_order ?? nextOrder);
  const [published, setPublished] = useState(initial?.is_published ?? true);
  const [page, setPage] = useState<PromoPage>(initial?.page ?? EMPTY_PAGE);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof PromoPage>(key: K, value: PromoPage[K]) => setPage((p) => ({ ...p, [key]: value }));
  const text = (key: keyof PromoPage, placeholder = "") => (
    <input className={inp} placeholder={placeholder} value={page[key] as string} onChange={(e) => set(key, e.target.value as never)} />
  );

  const save = async () => {
    const cleanSlug = slugify(slug || title);
    if (!cleanSlug || !title.trim()) return toast.error("A title (and address) is required");
    setBusy(true);
    const payload = {
      slug: cleanSlug,
      title: title.trim(),
      tag: tag.trim(),
      blurb: blurb.trim(),
      benefits,
      card_cta: cardCta.trim() || "Learn more",
      icon,
      display_order: Math.round(order),
      is_published: published,
      page: page as unknown as Json,
    };
    const q = initial
      ? supabase.from("promotions").update(payload).eq("id", initial.id)
      : supabase.from("promotions").insert(payload);
    const { error } = await q;
    setBusy(false);
    if (error) toast.error(error.message.includes("duplicate") ? "That address is already used by another promotion" : error.message);
    else { toast.success(initial ? "Saved" : "Created"); onSaved(); }
  };

  const open = countPlaceholders({ tag, title, blurb, benefits, page });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur" onClick={onClose}>
      <div className="my-6 w-full max-w-3xl rounded-lg border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl">{initial ? "Edit promotion" : "New promotion"}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Text in <b>[square brackets]</b> shows highlighted on the page until you replace it with the real detail.
              Use <b>**double stars**</b> for bold text.
            </p>
          </div>
          {open > 0 && <span className="shrink-0 bg-imperium/15 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-imperium">{open} to fill</span>}
        </div>

        <Group title="Home page card" hint="What visitors see in the Promotions row on the home page.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Label text="Title"><input className={inp} value={title} onChange={(e) => setTitle(e.target.value)} /></Label>
            <Label text="Small tag" hint="e.g. Masterclass · 2027"><input className={inp} value={tag} onChange={(e) => setTag(e.target.value)} /></Label>
          </div>
          <Label text="Short description"><textarea className={inp} rows={2} value={blurb} onChange={(e) => setBlurb(e.target.value)} /></Label>
          <Label text="Benefits" hint="one per line"><Lines value={benefits} onChange={setBenefits} /></Label>
          <div className="grid gap-3 sm:grid-cols-3">
            <Label text="Button text"><input className={inp} value={cardCta} onChange={(e) => setCardCta(e.target.value)} /></Label>
            <Label text="Icon">
              <select className={inp} value={icon} onChange={(e) => setIcon(e.target.value)}>
                {PROMO_ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </Label>
            <Label text="Order" hint="lower shows first"><input className={inp} type="number" value={order} onChange={(e) => setOrder(+e.target.value)} /></Label>
          </div>
          <Label text="Page address" hint={`cimperiumbrand.com/promo/${slugify(slug || title) || "…"}`}>
            <input className={inp} placeholder="idea-to-brand-2027" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </Label>
          {initial && slug && slug !== initial.slug && (
            <p className="text-xs text-imperium">Changing the address breaks links that were already shared. Only do this before you promote it.</p>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Published (visible on the website)
          </label>
        </Group>

        <Group title="Search and sharing" hint="What Google shows, and the preview when the link is shared on WhatsApp.">
          <Label text="Page title">{text("seo_title", "Idea to Brand 2027 | C Imperium Masterclass in Jos")}</Label>
          <Label text="Description" hint="about 150 characters">
            <textarea className={inp} rows={2} value={page.seo_description} onChange={(e) => set("seo_description", e.target.value)} />
          </Label>
          <Label text="Share image" hint="a site path such as /og-image.jpg, or a full image address">{text("og_image", "/og-image.jpg")}</Label>
        </Group>

        <Group title="Top of the page">
          <Label text="Small label above the heading">{text("pill", "C Imperium presents · Masterclass")}</Label>
          <Label text="Heading" hint="put *stars* around the word to highlight">{text("headline", "Idea to *Brand* 2027")}</Label>
          <Label text="Intro sentence"><textarea className={inp} rows={3} value={page.lead} onChange={(e) => set("lead", e.target.value)} /></Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Label text="Main button">{text("cta_primary")}</Label>
            <Label text="Second button" hint="leave empty to hide">{text("cta_secondary")}</Label>
          </div>
          <Label text="Details box" hint="e.g. Date, Venue, Time, Price">
            <Rows
              value={page.details}
              onChange={(v) => set("details", v)}
              fields={[{ key: "label", placeholder: "Label (Date)" }, { key: "value", placeholder: "Value ([Date] until known)" }]}
              empty={{ label: "", value: "" }}
              addLabel="Add detail"
            />
          </Label>
        </Group>

        <Group title="Benefits section" hint="Leave the list empty to hide this section.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Label text="Small label">{text("outcomes_kicker")}</Label>
            <Label text="Heading">{text("outcomes_title")}</Label>
          </div>
          <Rows
            value={page.outcomes}
            onChange={(v) => set("outcomes", v)}
            fields={[{ key: "title", placeholder: "Title" }, { key: "body", placeholder: "Text", long: true }]}
            empty={{ title: "", body: "" }}
            addLabel="Add benefit"
          />
          <Label text="Closing line">{text("outcomes_note")}</Label>
        </Group>

        <Group title="Steps section" hint="Leave the list empty to hide this section.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Label text="Small label">{text("steps_kicker")}</Label>
            <Label text="Heading">{text("steps_title")}</Label>
          </div>
          <Rows
            value={page.steps}
            onChange={(v) => set("steps", v)}
            fields={[{ key: "title", placeholder: "Step name" }, { key: "body", placeholder: "Short explanation" }]}
            empty={{ title: "", body: "" }}
            addLabel="Add step"
          />
          <Label text="Closing line">{text("steps_note")}</Label>
        </Group>

        <Group title="Who it is for" hint="Leave the list empty to hide this section.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Label text="Small label">{text("audience_kicker")}</Label>
            <Label text="Heading">{text("audience_title")}</Label>
          </div>
          <Label text="Points" hint="one per line"><Lines value={page.audience} onChange={(v) => set("audience", v)} /></Label>
        </Group>

        <Group title="Questions" hint="Leave the list empty to hide this section.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Label text="Small label">{text("faq_kicker")}</Label>
            <Label text="Heading">{text("faq_title")}</Label>
          </div>
          <Rows
            value={page.faq.map((f) => ({ q: f.q, a: f.a }))}
            onChange={(v) => set("faq", v)}
            fields={[{ key: "q", placeholder: "Question" }, { key: "a", placeholder: "Answer", long: true }]}
            empty={{ q: "", a: "" }}
            addLabel="Add question"
          />
        </Group>

        <Group title="Booking box at the bottom">
          <Label text="Heading">{text("final_title")}</Label>
          <Label text="Sentence under it">{text("final_sub")}</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Label text="WhatsApp button text">{text("button_label")}</Label>
            <Label text="WhatsApp number" hint="digits only, with country code">{text("whatsapp_number", "2349010912491")}</Label>
          </div>
          <Label text="Message pre-filled in WhatsApp">{text("whatsapp_message")}</Label>
          <Label text="Contact details shown with a Copy button" hint="one per line"><Lines value={page.contacts} onChange={(v) => set("contacts", v)} rows={3} /></Label>
        </Group>

        <div className="mt-8 flex items-center justify-end gap-3 border-t border-border pt-5">
          {initial && (
            <a href={`/promo/${initial.slug}`} target="_blank" rel="noopener" className={cn(btnGhost, "mr-auto inline-flex items-center gap-2")}>
              <ExternalLink className="h-3 w-3" /> View page
            </a>
          )}
          <button onClick={onClose} className={btnGhost}>Cancel</button>
          <button onClick={save} disabled={busy} className="border border-imperium bg-imperium px-5 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-charleston disabled:opacity-50">
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

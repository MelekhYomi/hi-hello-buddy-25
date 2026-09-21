import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { recommendServices, rateAdvice, type ServiceAdvice } from "@/lib/ai.functions";
import { useQuoteBuilder } from "@/lib/quote-context";
import { saveAdvisorHandoff } from "@/lib/advisor-handoff";
import { getAnonId } from "@/lib/anon-id";
import {
  Sparkles,
  Loader2,
  Check,
  Plus,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

const PRIORITY_LABEL: Record<string, string> = {
  essential: "Essential",
  recommended: "Recommended",
  optional: "Optional",
};

export function AiAdvisor() {
  const advise = useServerFn(recommendServices);
  const rate = useServerFn(rateAdvice);
  const { add, has } = useQuoteBuilder();
  const [brief, setBrief] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<ServiceAdvice | null>(null);
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const submit = async () => {
    if (brief.trim().length < 10) {
      toast.error("Tell us a little more about what you need");
      return;
    }
    setLoading(true);
    setRating(null);
    setComment("");
    setFeedbackSent(false);
    try {
      const result = await advise({
        data: { brief: brief.trim(), budget: budget.trim() || null, anon_id: getAnonId() || null },
      });
      setAdvice(result);
      saveAdvisorHandoff({
        sessionId: result.session_id ?? null,
        brief: brief.trim(),
        budget: budget.trim() || null,
        summary: result.summary,
        plan: result.suggested_plan,
        planReason: result.plan_reason,
        questions: result.questions ?? [],
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The advisor is unavailable right now");
    } finally {
      setLoading(false);
    }
  };

  const addAll = () => {
    advice?.recommendations.forEach((r) => {
      const svc = services?.find((s) => s.slug === r.slug);
      if (!svc || has(svc.id)) return;
      add(
        {
          id: svc.id,
          type: "service",
          slug: svc.slug,
          title: svc.title,
          unitPrice: svc.price_min ?? 0,
          onRequest: svc.price_min == null,
        },
        r.quantity,
      );
    });
  };

  return (
    <section id="advisor" className="relative border-t border-border/40 py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">
            <Sparkles className="h-3.5 w-3.5" /> AI-powered
          </div>
          <h2 className="mt-4 font-display text-4xl leading-[0.9] md:text-6xl">
            NOT SURE WHAT YOU NEED?
          </h2>
          <div className="mx-auto mt-6 h-px w-24 bg-imperium" />
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Describe your business and what you're trying to achieve. We'll suggest the right
            services, build your quote, and explain your payment options.
          </p>
        </div>

        <div className="mt-10 border border-border/60 bg-card p-6 md:p-8">
          <label className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Your needs
          </label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="e.g. I'm opening a small restaurant in Jos next month. I need a logo, menu design, signage and someone to run my Instagram."
            className="mt-2 w-full resize-none border border-border bg-background px-4 py-3 text-sm outline-none focus:border-imperium"
          />
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <label className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Budget (optional)
              </label>
              <input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                maxLength={120}
                placeholder="e.g. around ₦500,000"
                className="mt-2 w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-imperium"
              />
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 bg-imperium px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-imperium-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Thinking" : "Get recommendations"}
            </button>
          </div>
        </div>

        {advice && (
          <div className="mt-8 space-y-6">
            <p className="text-sm leading-relaxed text-muted-foreground">{advice.summary}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              {advice.recommendations.map((r) => {
                const svc = services?.find((s) => s.slug === r.slug);
                const inQuote = svc ? has(svc.id) : false;
                return (
                  <article key={r.slug} className="flex flex-col border border-border/60 bg-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-xl">{r.title}</h3>
                      <span className="shrink-0 border border-imperium/50 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-imperium">
                        {PRIORITY_LABEL[r.priority] ?? r.priority}
                      </span>
                    </div>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{r.why}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        {svc
                          ? svc.price_min == null
                            ? "Price on request"
                            : `From ₦${svc.price_min.toLocaleString("en-NG")}`
                          : ""}
                        {r.quantity > 1 ? ` · qty ${r.quantity}` : ""}
                      </span>
                      <button
                        type="button"
                        disabled={!svc || inQuote}
                        onClick={() =>
                          svc &&
                          add(
                            {
                              id: svc.id,
                              type: "service",
                              slug: svc.slug,
                              title: svc.title,
                              unitPrice: svc.price_min ?? 0,
                              onRequest: svc.price_min == null,
                            },
                            r.quantity,
                          )
                        }
                        className="inline-flex items-center gap-1.5 border border-imperium px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-imperium disabled:opacity-50"
                      >
                        {inQuote ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        {inQuote ? "In quote" : "Add"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {advice.recommendations.length > 1 && (
              <button
                type="button"
                onClick={addAll}
                className="inline-flex items-center gap-2 bg-imperium px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-imperium-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> Add all to my quote
              </button>
            )}

            <div className="border border-border/60 bg-card p-6">
              <h3 className="font-display text-xl">How your quote works</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {advice.quote_explanation}
              </p>
              <div className="mt-4 border-t border-border/50 pt-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-imperium">
                  Suggested payment plan · {advice.suggested_plan}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {advice.plan_reason}
                </p>
              </div>
            </div>

            {advice.questions.length > 0 && (
              <div className="border border-border/60 bg-card p-6">
                <h3 className="flex items-center gap-2 font-display text-xl">
                  <HelpCircle className="h-5 w-5 text-imperium" /> What we'll ask you next
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {advice.questions.slice(0, 3).map((q) => (
                    <li key={q} className="flex gap-2">
                      <span className="text-imperium">·</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="font-mono text-[11px] text-muted-foreground">
              AI suggestions are a guide — a C Imperium consultant confirms every quote.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

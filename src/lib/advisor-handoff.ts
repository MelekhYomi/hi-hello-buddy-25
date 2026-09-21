// Hands the AI advisor's context over to the quote page (browser only).

export interface AdvisorHandoff {
  sessionId: string | null;
  brief: string;
  budget: string | null;
  summary: string;
  plan: string;
  planReason: string;
  questions: string[];
}

const KEY = "ci_advisor_handoff_v1";

export function saveAdvisorHandoff(h: AdvisorHandoff) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(h));
  } catch {}
}

export function readAdvisorHandoff(): AdvisorHandoff | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AdvisorHandoff) : null;
  } catch {
    return null;
  }
}

export function clearAdvisorHandoff() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}

/** Pre-filled "Project details" text for the quote form. */
export function handoffNotes(h: AdvisorHandoff): string {
  const parts = [
    `What I need: ${h.brief}`,
    h.budget ? `Budget: ${h.budget}` : null,
    h.summary ? `Advisor summary: ${h.summary}` : null,
    h.plan ? `Suggested payment plan: ${h.plan}${h.planReason ? ` — ${h.planReason}` : ""}` : null,
  ].filter(Boolean);
  return parts.join("\n\n").slice(0, 2000);
}

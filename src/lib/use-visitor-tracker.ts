import { useEffect, useRef } from "react";
import { useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getAnonId, getSessionId } from "./anon-id";

type EventType = "pageview" | "click" | "section_view" | "scroll";

let queue: any[] = [];
let flushTimer: number | null = null;

function flush() {
  if (queue.length === 0) return;
  const batch = queue.splice(0, queue.length);
  // Best effort, don't await
  supabase.from("visitor_events").insert(batch).then(() => {});
}

function track(type: EventType, payload: Partial<{ path: string; target: string; metadata: Record<string, unknown> }> = {}) {
  if (typeof window === "undefined") return;
  queue.push({
    anon_id: getAnonId(),
    session_id: getSessionId(),
    event_type: type,
    path: payload.path ?? window.location.pathname,
    target: payload.target ?? null,
    metadata: payload.metadata ?? {},
    user_agent: navigator.userAgent.slice(0, 500),
    referrer: document.referrer ? document.referrer.slice(0, 500) : null,
  });
  if (flushTimer) window.clearTimeout(flushTimer);
  flushTimer = window.setTimeout(flush, 1500);
}

export function trackEvent(type: EventType, payload?: Parameters<typeof track>[1]) {
  track(type, payload);
}

export function useVisitorTracker() {
  const location = useLocation();
  const lastPathRef = useRef<string | null>(null);

  // pageview
  useEffect(() => {
    if (lastPathRef.current === location.pathname) return;
    lastPathRef.current = location.pathname;
    track("pageview");
  }, [location.pathname]);

  // global click delegation
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const trackable = t.closest<HTMLElement>("[data-track]");
      if (!trackable) return;
      track("click", {
        target: trackable.getAttribute("data-track") ?? trackable.tagName,
        metadata: { text: trackable.textContent?.slice(0, 80) ?? "" },
      });
    };
    document.addEventListener("click", onClick);

    // depth scroll
    let maxDepth = 0;
    const onScroll = () => {
      const h = document.documentElement;
      const depth = Math.round(((h.scrollTop + window.innerHeight) / h.scrollHeight) * 100);
      if (depth > maxDepth + 10 && depth <= 100) {
        maxDepth = depth;
        if (depth === 25 || depth === 50 || depth === 75 || depth === 100) {
          track("scroll", { metadata: { depth } });
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const onUnload = () => flush();
    window.addEventListener("beforeunload", onUnload);

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);
}

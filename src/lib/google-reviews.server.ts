import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_PLACE_ID = "ChIJpYDYfYpzUxARKEg_uG6FovM";

type PlaceReview = {
  name?: string;
  rating?: number;
  publishTime?: string;
  text?: { text?: string };
  originalText?: { text?: string };
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
};

type PlaceResponse = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: PlaceReview[];
};

export type GoogleSyncResult = {
  fetched: number;
  imported: number;
  updated: number;
  rating: number | null;
  total: number | null;
};

function env(name: string): string | undefined {
  const cfEnv = typeof globalThis !== "undefined" ? (globalThis as any)._cf_env : undefined;
  return cfEnv?.[name] || (typeof process !== "undefined" ? process.env[name] : undefined) || undefined;
}

/**
 * Pulls reviews for the business from the Google Places API (New) and upserts
 * them into public.testimonials. Google returns at most 5 reviews per call, so
 * running this on a schedule is what accumulates the full history over time.
 * Existing rows keep their admin-controlled is_published / display_order.
 */
export async function syncGoogleReviews(): Promise<GoogleSyncResult> {
  const apiKey = env("GOOGLE_PLACES_API_KEY");
  if (!apiKey) {
    throw new Error("Google reviews are not configured: set GOOGLE_PLACES_API_KEY.");
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as SupabaseClient<any>;

  const { data: setting } = await db.from("site_settings").select("value").eq("key", "google_reviews").maybeSingle();
  const cfg = (setting?.value ?? {}) as Record<string, unknown>;
  const placeId = env("GOOGLE_PLACE_ID") || (cfg.place_id as string | undefined) || DEFAULT_PLACE_ID;

  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,reviews",
    },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Google Places API ${res.status}: ${detail.slice(0, 300)}`);
  }
  const place = (await res.json()) as PlaceResponse;

  const reviews = (place.reviews ?? []).filter((r) => r.name && (r.text?.text || r.originalText?.text)?.trim());
  const ids = reviews.map((r) => r.name as string);

  const existing = new Set<string>();
  if (ids.length) {
    const { data, error } = await db.from("testimonials").select("external_id").in("external_id", ids);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) existing.add(row.external_id as string);
  }

  let imported = 0;
  let updated = 0;
  for (const r of reviews) {
    const rating = Math.min(5, Math.max(1, Math.round(r.rating ?? 5)));
    const fields = {
      name: r.authorAttribution?.displayName?.trim() || "Google reviewer",
      quote: (r.text?.text || r.originalText?.text || "").trim(),
      rating,
      avatar_url: r.authorAttribution?.photoUri ?? null,
      review_url: r.authorAttribution?.uri ?? null,
      review_time: r.publishTime ?? null,
    };
    if (existing.has(r.name as string)) {
      const { error } = await db.from("testimonials").update(fields).eq("external_id", r.name as string);
      if (error) throw new Error(error.message);
      updated++;
    } else {
      const { error } = await db.from("testimonials").insert({
        ...fields,
        role: "",
        company: "Google review",
        display_order: 0,
        // 4-5 star reviews go live automatically; lower ones wait for an admin to publish.
        is_published: rating >= 4,
        source: "google",
        external_id: r.name as string,
      });
      if (error) throw new Error(error.message);
      imported++;
    }
  }

  const summary = {
    ...cfg,
    place_id: placeId,
    rating: place.rating ?? null,
    total: place.userRatingCount ?? null,
    maps_url: place.googleMapsUri ?? (cfg.maps_url as string | undefined) ?? null,
    last_synced_at: new Date().toISOString(),
  };
  const { error: sErr } = await db.from("site_settings").upsert({ key: "google_reviews", value: summary }, { onConflict: "key" });
  if (sErr) throw new Error(sErr.message);

  return { fetched: reviews.length, imported, updated, rating: place.rating ?? null, total: place.userRatingCount ?? null };
}

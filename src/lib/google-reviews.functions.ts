import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Admin-only: pull the latest Google reviews now. */
export const syncGoogleReviewsNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (error) throw new Error(error.message);
    if (!isAdmin) throw new Error("Forbidden");
    const { syncGoogleReviews } = await import("./google-reviews.server");
    return syncGoogleReviews();
  });

import { supabase } from "@/integrations/supabase/client";

/** Starts Google sign-in/sign-up through Supabase Auth (the Google provider must be enabled there). */
export async function signInWithGoogle(redirectTo?: string) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectTo ?? window.location.origin },
  });
  return { error };
}

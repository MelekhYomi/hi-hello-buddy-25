// Everything that used to run on the Node server, bundled as one Supabase Edge Function ("api").
import "@/lib/admin.functions";
import "@/lib/ai.functions";
import "@/lib/billing.functions";
import "@/lib/calendar.functions";
import "@/lib/export.functions";
import "@/lib/google-reviews.functions";
import "@/lib/paystack.functions";
import "@/lib/termii.functions";
import "@/routes/api/public/paystack-webhook";
import "@/routes/api/public/pdf.$kind.$token";
import "@/routes/api/public/sync-google-reviews";
import "@/routes/api/public/v1.$dataset";
import { handle } from "./runtime";

export { handle };

declare const Deno: { serve: (h: (r: Request) => Response | Promise<Response>) => void } | undefined;
if (typeof Deno !== "undefined") Deno.serve(handle);

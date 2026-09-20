import { createServerFn } from "@tanstack/react-start";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";

const InputSchema = z.object({
  brief: z.string().trim().min(10).max(2000),
  budget: z.string().trim().max(120).nullable().optional(),
  anon_id: z.string().trim().max(64).nullable().optional(),
});

const RecommendationSchema = z.object({
  recommendations: z
    .array(
      z.object({
        slug: z.string(),
        title: z.string(),
        why: z.string(),
        quantity: z.number().int(),
        priority: z.enum(["essential", "recommended", "optional"]),
      }),
    ),
  summary: z.string(),
  quote_explanation: z.string(),
  suggested_plan: z.enum(["full", "70/30", "50/50", "30/70"]),
  plan_reason: z.string(),
  questions: z.array(z.string()),
});

export type ServiceAdvice = z.infer<typeof RecommendationSchema> & { session_id?: string | null };

/** Public: describe your needs, get matching C Imperium services + a plain explanation of quote options. */
export const recommendServices = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<ServiceAdvice> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: services, error } = await supabaseAdmin
      .from("services")
      .select("slug, title, description, features, price_min, price_max")
      .eq("is_active", true)
      .order("display_order");
    if (error) throw new Error(error.message);
    if (!services?.length) throw new Error("No services available to recommend");

    const catalogue = services
      .map(
        (s) =>
          `- slug: ${s.slug} | title: ${s.title} | price: ${
            s.price_min == null ? "on request" : `from NGN ${s.price_min}${s.price_max ? ` to NGN ${s.price_max}` : ""}`
          } | ${s.description} | includes: ${(s.features ?? []).join(", ")}`,
      )
      .join("\n");

    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: key,
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });

    const system = `You are a branding consultant for C Imperium Branding, a branding agency in Jos, Nigeria. Currency is Nigerian Naira (NGN).
Recommend ONLY services from this catalogue, using the exact slug and title:
${catalogue}

Rules:
- Pick 1 to 5 services that genuinely fit the customer's brief; mark each as essential, recommended or optional.
- quantity is how many units of that service they likely need (usually 1).
- "why" is one short sentence in plain language addressed to the customer.
- "summary" is 1-2 sentences describing what you think they need.
- "quote_explanation" explains, in plain language and max 90 words, how the quote works at C Imperium: they get an instant estimate on the website, then an invoice by email or WhatsApp, they can pay in full or pay a deposit to start the job, and a receipt is sent after payment. Mention that items priced "on request" are confirmed by a consultant.
- "suggested_plan" is one of full, 70/30, 50/50, 30/70 (upfront/balance), with a one-sentence plan_reason.
- "questions" is up to 3 short questions a consultant should ask them next.
- Never invent prices or services that are not in the catalogue.`;

    try {
      const result = streamText({
        model: lovable.responses("openai/gpt-6-astra"),
        system,
        prompt: `Customer brief: ${data.brief}\nBudget note: ${data.budget || "not given"}`,
        output: Output.object({ schema: RecommendationSchema }),
        providerOptions: {
          openai: {
            forceReasoning: true,
            reasoningEffort: "low",
            reasoningSummary: "auto",
            store: false,
            include: ["reasoning.encrypted_content"],
          },
        },
      });

      const output = await result.output;
      const valid = new Set(services.map((s) => s.slug));
      return {
        ...output,
        recommendations: output.recommendations
          .filter((r) => valid.has(r.slug))
          .slice(0, 5)
          .map((r) => ({ ...r, quantity: Math.min(99, Math.max(1, r.quantity || 1)) })),
      };
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) {
        throw new Error("The advisor couldn't read that. Please describe your needs again in a bit more detail.");
      }
      throw err;
    }
  });

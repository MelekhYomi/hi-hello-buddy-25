import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const TIMES = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];

const schema = z.object({
  full_name: z.string().trim().min(2, "Name is too short").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  company: z.string().trim().max(100).optional().or(z.literal("")),
  service_id: z.string().uuid().nullable(),
  preferred_date: z.string().min(1, "Pick a date"),
  preferred_time: z.string().min(1, "Pick a time"),
  project_details: z.string().trim().max(2000).optional().or(z.literal("")),
});

const inputClass =
  "w-full rounded-md border border-border/70 bg-card/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-imperium";

const labelClass =
  "font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground";

export function BookingSection() {
  const { user } = useAuth();

  const { data: services } = useQuery({
    queryKey: ["services-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id,title")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const [fullName, setFullName] = useState(user?.user_metadata?.display_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [serviceId, setServiceId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      full_name: fullName,
      email,
      phone,
      company,
      service_id: serviceId && serviceId !== "other" ? serviceId : null,
      preferred_date: date,
      preferred_time: time,
      project_details: details,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("bookings").insert({
      user_id: user?.id ?? null,
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      company: parsed.data.company || null,
      service_id: parsed.data.service_id,
      preferred_date: parsed.data.preferred_date,
      preferred_time: parsed.data.preferred_time,
      project_details: parsed.data.project_details || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Booking received. We'll confirm by email shortly.");
    setPhone(""); setCompany(""); setServiceId(""); setDate(""); setTime(""); setDetails("");
  };

  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <section id="book" className="relative border-t border-border/40 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        {/* Heading — left aligned per reference */}
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">
            Start your project
          </div>
          <h2 className="mt-4 font-display text-5xl leading-[0.9] md:text-7xl">
            BOOK CONSULTATION
          </h2>
          <div className="mt-6 h-px w-24 bg-imperium" />
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Schedule a free consultation with our team. We'll discuss your
            vision, assess your needs, and outline a roadmap to elevate your brand.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* Left column */}
          <aside className="md:col-span-5 space-y-8">
            <div className="border-l-2 border-imperium pl-5">
              <h3 className="font-display text-xl tracking-tight">
                WHY BOOK A CONSULTATION?
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Every great brand starts with a conversation. Our consultation
                is a strategic session where we understand your business, your
                audience, and your ambitions. No obligations — just clarity.
              </p>
            </div>

            <ul className="space-y-3">
              {[
                "Free 30-minute strategic session",
                "Tailored brand recommendations",
                "Clear project scope and pricing",
                "Direct access to senior designers",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground/90">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-imperium" strokeWidth={2} />
                  {item}
                </li>
              ))}
            </ul>

            <div className="border border-border/60 bg-card/40 p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-imperium">
                Office location
              </div>
              <div className="mt-3 font-display text-lg">Jos, Plateau State</div>
              <div className="text-sm text-muted-foreground">Nigeria</div>
              <div className="mt-3 text-xs text-muted-foreground/80">
                Serving clients from Lagos to London, Abuja to New York.
              </div>
            </div>
          </aside>

          {/* Form */}
          <form onSubmit={submit} className="md:col-span-7 space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="Full name" required>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Your name"
                  className={inputClass}
                />
              </Field>
              <Field label="Email" required>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className={inputClass}
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234…"
                  className={inputClass}
                />
              </Field>
              <Field label="Company">
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Your company"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Service interested in">
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className={inputClass}
              >
                <option value="" className="bg-card">Select a service</option>
                {services?.map((s) => (
                  <option key={s.id} value={s.id} className="bg-card">{s.title}</option>
                ))}
                <option value="other" className="bg-card">Other (tell us in the details)</option>
              </select>
            </Field>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field
                label={
                  <span className="inline-flex items-center gap-2">
                    <CalendarIcon className="h-3.5 w-3.5" /> Preferred date
                  </span>
                }
                required
              >
                <input
                  type="date"
                  value={date}
                  min={today}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className={inputClass}
                />
              </Field>
              <Field
                label={
                  <span className="inline-flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" /> Preferred time
                  </span>
                }
                required
              >
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className={inputClass}
                >
                  <option value="" className="bg-card">Select time</option>
                  {TIMES.map((t) => (
                    <option key={t} value={t} className="bg-card">{t}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Project details">
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={5}
                maxLength={2000}
                placeholder="Tell us about your project, goals, and timeline…"
                className={`${inputClass} resize-none`}
              />
            </Field>

            <button
              type="submit"
              disabled={busy}
              className="btn-cta mt-2 h-14 w-full px-6 disabled:opacity-50"
            >
              {busy ? "Sending…" : "Book consultation"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClass}>
        {label}
        {required && <span className="text-imperium"> *</span>}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
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
  preferred_date: z.date(),
  preferred_time: z.string().min(1),
  project_details: z.string().trim().max(2000).optional().or(z.literal("")),
});

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
  const [date, setDate] = useState<Date | undefined>();
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
      service_id: serviceId || null,
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
      preferred_date: format(parsed.data.preferred_date, "yyyy-MM-dd"),
      preferred_time: parsed.data.preferred_time,
      project_details: parsed.data.project_details || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Booking received. We'll confirm by email shortly.");
    setPhone(""); setCompany(""); setServiceId(""); setDate(undefined); setTime(""); setDetails("");
  };

  return (
    <section id="book" className="relative border-t border-border/40 bg-card/40 py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">
              [04] Let's talk
            </div>
            <h2 className="mt-4 font-display text-5xl leading-[0.9] md:text-6xl">
              BOOK A<br />CONSULTATION.
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Tell us about your project. We'll respond within 24 hours with
              availability and a brief response document.
            </p>
            <ul className="mt-8 space-y-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <li className="flex items-center gap-3"><span className="h-px w-6 bg-imperium" />Free 30-min strategy call</li>
              <li className="flex items-center gap-3"><span className="h-px w-6 bg-imperium" />Naira pricing, transparent</li>
              <li className="flex items-center gap-3"><span className="h-px w-6 bg-imperium" />Jos · Lagos · remote</li>
            </ul>
          </div>

          <form onSubmit={submit} className="md:col-span-7 space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField label="Full name" value={fullName} onChange={setFullName} required />
              <FormField label="Email" type="email" value={email} onChange={setEmail} required />
              <FormField label="Phone" value={phone} onChange={setPhone} />
              <FormField label="Company" value={company} onChange={setCompany} />
            </div>

            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Service</span>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="mt-2 w-full border-b border-border bg-transparent py-3 text-base outline-none focus:border-imperium"
              >
                <option value="" className="bg-card">Select a service…</option>
                {services?.map((s) => (
                  <option key={s.id} value={s.id} className="bg-card">{s.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Preferred date</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "mt-2 h-12 w-full justify-start rounded-none border-0 border-b border-border bg-transparent px-0 text-base font-normal hover:bg-transparent",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Preferred time</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {TIMES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTime(t)}
                      className={cn(
                        "border px-3 py-1.5 font-mono text-[11px] tracking-wider transition-colors",
                        time === t
                          ? "border-imperium bg-imperium text-primary-foreground"
                          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Project details</span>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                maxLength={2000}
                className="mt-2 w-full resize-none border-b border-border bg-transparent py-3 text-base outline-none focus:border-imperium"
                placeholder="Tell us about your brand, goals, timeline, budget…"
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="mt-2 w-full bg-imperium py-4 font-mono text-[11px] uppercase tracking-[0.3em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 md:w-auto md:px-12"
            >
              {busy ? "Sending…" : "Submit booking"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function FormField({
  label,
  type = "text",
  value,
  onChange,
  required,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        {label}{required && <span className="text-imperium"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-2 w-full border-b border-border bg-transparent py-3 text-base outline-none focus:border-imperium"
      />
    </label>
  );
}

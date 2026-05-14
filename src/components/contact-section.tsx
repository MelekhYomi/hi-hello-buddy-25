import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, MapPin, MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "2348038577654"; // change to real number
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi C Imperium, I'd like to discuss a project.")}`;

const schema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  subject: z.string().trim().max(150).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Message is too short").max(2000),
});

export function ContactSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email, phone, subject, message });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("contacts").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Message sent. We'll be in touch.");
    setName(""); setEmail(""); setPhone(""); setSubject(""); setMessage("");
  };

  return (
    <section id="contact" className="border-t border-border/40 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">Get in touch</div>
          <h2 className="mt-4 font-display text-5xl leading-[0.9] md:text-7xl">CONTACT US</h2>
          <div className="mx-auto mt-6 h-px w-24 bg-imperium" />
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Ready to elevate your brand? Reach out via WhatsApp for instant response, or send us a
            message and we'll get back within 24 hours.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="space-y-4 md:col-span-5">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-4 border border-emerald-700/60 bg-emerald-950/20 p-6 transition-all hover:border-emerald-500 hover:-translate-y-1 hover:shadow-[0_0_30px_-10px_rgb(16,185,129)]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600/20">
                <MessageCircle className="h-6 w-6 text-emerald-400" strokeWidth={1.5} />
              </div>
              <div>
                <div className="font-display text-lg">Chat on WhatsApp</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Fastest way to reach us. Available during business hours.
                </p>
                <div className="mt-3 font-mono text-xs text-emerald-400 transition-all group-hover:translate-x-1">
                  +234 800 000 0000 →
                </div>
              </div>
            </a>

            <div className="grid grid-cols-2 gap-4">
              <a
                href="mailto:hello@cimperium.com"
                className="group block border border-border/60 bg-card p-5 transition-all hover:border-imperium hover:-translate-y-1"
              >
                <Mail className="h-5 w-5 text-imperium" strokeWidth={1.5} />
                <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Email</div>
                <div className="mt-1 text-sm">hello@cimperium.com</div>
              </a>
              <div className="border border-border/60 bg-card p-5">
                <MapPin className="h-5 w-5 text-imperium" strokeWidth={1.5} />
                <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Location</div>
                <div className="mt-1 text-sm">Jos, Plateau State, Nigeria</div>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="md:col-span-7 space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="Name" value={name} onChange={setName} required />
              <Field label="Email" type="email" value={email} onChange={setEmail} required />
              <Field label="Phone" value={phone} onChange={setPhone} />
              <Field label="Subject" value={subject} onChange={setSubject} />
            </div>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Message <span className="text-imperium">*</span>
              </span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                maxLength={2000}
                required
                className="mt-2 w-full resize-none border-b border-border bg-transparent py-3 text-base outline-none focus:border-imperium"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="btn-cta h-14 w-full px-12 disabled:opacity-50 md:w-auto"
            >
              {busy ? "Sending…" : "Send message"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Field({
  label, type = "text", value, onChange, required,
}: { label: string; type?: string; value: string; onChange: (v: string) => void; required?: boolean }) {
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

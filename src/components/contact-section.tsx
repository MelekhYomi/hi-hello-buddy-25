import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, MapPin, Phone } from "lucide-react";

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
    <section id="contact" className="border-t border-border/40 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">
              [05] Reach out
            </div>
            <h2 className="mt-4 font-display text-5xl leading-[0.9] md:text-6xl">
              CONTACT<br />THE STUDIO.
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
              For partnerships, press, careers, or general questions — drop a line.
              We read everything.
            </p>

            <ul className="mt-10 space-y-5 font-mono text-[11px] uppercase tracking-[0.2em]">
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-imperium" strokeWidth={1.5} />
                <a href="mailto:hello@cimperium.ng" className="story-link">hello@cimperium.ng</a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-imperium" strokeWidth={1.5} />
                <a href="tel:+2348000000000" className="story-link">+234 800 000 0000</a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-imperium" strokeWidth={1.5} />
                <span className="text-muted-foreground">Jos · Plateau · Nigeria</span>
              </li>
            </ul>
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
              className="w-full bg-imperium py-4 font-mono text-[11px] uppercase tracking-[0.3em] text-primary-foreground hover:opacity-90 disabled:opacity-50 md:w-auto md:px-12"
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

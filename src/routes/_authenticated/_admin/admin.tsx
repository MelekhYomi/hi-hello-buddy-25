import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Check, Mail, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_admin/admin")({
  head: () => ({ meta: [{ title: "Admin — C Imperium Branding" }] }),
  component: AdminPage,
});

const STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;

function AdminPage() {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"bookings" | "contacts">("bookings");

  const bookings = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, services(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const contacts = useQuery({
    queryKey: ["admin-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Marked ${status}`);
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
    }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm("Delete this booking?")) return;
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
    }
  };

  const markRead = async (id: string, isRead: boolean) => {
    const { error } = await supabase.from("contacts").update({ is_read: isRead }).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin-contacts"] });
  };

  const deleteContact = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-contacts"] });
    }
  };

  const unreadContacts = contacts.data?.filter((c) => !c.is_read).length ?? 0;
  const pendingBookings = bookings.data?.filter((b) => b.status === "pending").length ?? 0;

  return (
    <div className="grain relative min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">
              Command center
            </div>
            <h1 className="mt-3 font-display text-5xl md:text-7xl">ADMIN.</h1>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {user?.email}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/dashboard" className="border border-border px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
              My account
            </Link>
            <button
              onClick={() => signOut()}
              className="border border-border px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:border-foreground hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-1 gap-px bg-border/40 md:grid-cols-3">
          <Stat label="Total bookings" value={bookings.data?.length ?? 0} />
          <Stat label="Pending" value={pendingBookings} accent />
          <Stat label="Unread messages" value={unreadContacts} accent />
        </div>

        {/* Tabs */}
        <div className="mt-12 flex gap-8 border-b border-border/40 font-mono text-[11px] uppercase tracking-[0.25em]">
          <TabButton active={tab === "bookings"} onClick={() => setTab("bookings")}>
            Bookings ({bookings.data?.length ?? 0})
          </TabButton>
          <TabButton active={tab === "contacts"} onClick={() => setTab("contacts")}>
            Messages ({contacts.data?.length ?? 0})
            {unreadContacts > 0 && (
              <span className="ml-2 inline-flex h-4 min-w-4 items-center justify-center bg-imperium px-1 text-[9px] text-primary-foreground">
                {unreadContacts}
              </span>
            )}
          </TabButton>
        </div>

        {tab === "bookings" && (
          <div className="mt-8 space-y-px bg-border/40">
            {bookings.isLoading && <div className="bg-card p-6 font-mono text-xs">Loading…</div>}
            {bookings.data?.length === 0 && (
              <div className="bg-card p-12 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                No bookings yet
              </div>
            )}
            {bookings.data?.map((b) => (
              <article key={b.id} className="bg-card p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                  <div className="md:col-span-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {format(new Date(b.preferred_date), "MMM d, yyyy")} · {b.preferred_time}
                    </div>
                    <div className="mt-1 font-display text-xl">{b.full_name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{b.email}</div>
                    {b.phone && <div className="font-mono text-[10px] text-muted-foreground">{b.phone}</div>}
                    {b.company && <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{b.company}</div>}
                  </div>
                  <div className="md:col-span-6">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-imperium">
                      {b.services?.title ?? "General consultation"}
                    </div>
                    {b.project_details && (
                      <p className="mt-2 text-sm text-muted-foreground">{b.project_details}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-2 md:col-span-3 md:items-end">
                    <select
                      value={b.status}
                      onChange={(e) => updateBookingStatus(b.id, e.target.value)}
                      className="border border-border bg-card px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] outline-none focus:border-imperium"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => deleteBooking(b.id)}
                      className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-imperium"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "contacts" && (
          <div className="mt-8 space-y-px bg-border/40">
            {contacts.isLoading && <div className="bg-card p-6 font-mono text-xs">Loading…</div>}
            {contacts.data?.length === 0 && (
              <div className="bg-card p-12 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                No messages yet
              </div>
            )}
            {contacts.data?.map((c) => (
              <article key={c.id} className={cn("bg-card p-6", !c.is_read && "border-l-2 border-imperium")}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                  <div className="md:col-span-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {format(new Date(c.created_at), "MMM d, HH:mm")}
                    </div>
                    <div className="mt-1 font-display text-lg">{c.name}</div>
                    <a href={`mailto:${c.email}`} className="font-mono text-[10px] text-muted-foreground hover:text-imperium">
                      {c.email}
                    </a>
                    {c.phone && <div className="font-mono text-[10px] text-muted-foreground">{c.phone}</div>}
                  </div>
                  <div className="md:col-span-6">
                    {c.subject && (
                      <div className="font-display text-base">{c.subject}</div>
                    )}
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{c.message}</p>
                  </div>
                  <div className="flex flex-col items-start gap-2 md:col-span-3 md:items-end">
                    <button
                      onClick={() => markRead(c.id, !c.is_read)}
                      className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
                    >
                      {c.is_read ? <><Mail className="h-3 w-3" /> Unread</> : <><Check className="h-3 w-3" /> Mark read</>}
                    </button>
                    <button
                      onClick={() => deleteContact(c.id)}
                      className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-imperium"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-card p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
      <div className={cn("mt-2 font-display text-5xl", accent ? "text-imperium" : "text-foreground")}>
        {value}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative -mb-px border-b-2 pb-4 transition-colors",
        active ? "border-imperium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

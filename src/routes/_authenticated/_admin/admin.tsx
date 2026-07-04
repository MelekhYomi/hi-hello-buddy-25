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
import { Check, Mail, Trash2, Download, Plus, Pencil } from "lucide-react";
import { formatNaira } from "@/lib/cart-context";

export const Route = createFileRoute("/_authenticated/_admin/admin")({
  head: () => ({ meta: [{ title: "Admin — C Imperium Branding" }] }),
  component: AdminPage,
});

const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;
const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
const PAY_STATUSES = ["unpaid", "paid", "pay_on_delivery", "whatsapp_pending", "refunded"] as const;

type Tab = "bookings" | "contacts" | "orders" | "products" | "leads" | "blog" | "settings" | "users" | "payments" | "studio" | "testimonials" | "services" | "case_studies" | "categories" | "delivery";

function AdminPage() {
  const { user, signOut, isSuperAdmin } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("bookings");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [orderPayFilter, setOrderPayFilter] = useState<string>("all");
  const [orderSearch, setOrderSearch] = useState("");

  const bookings = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select("*, services(title)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const contacts = useQuery({
    queryKey: ["admin-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contacts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const products = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const leads = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Marked ${status}`); qc.invalidateQueries({ queryKey: ["admin-bookings"] }); }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm("Delete this booking?")) return;
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-bookings"] }); }
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
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-contacts"] }); }
  };

  const updateOrder = async (id: string, patch: { status?: string; payment_status?: string }) => {
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-orders"] }); }
  };

  const deleteLead = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-leads"] }); }
  };

  const exportLeadsCSV = () => {
    const rows = leads.data ?? [];
    const headers = ["created_at", "name", "email", "phone", "source", "interest"];
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => JSON.stringify((r as Record<string, unknown>)[h] ?? "")).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `leads-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const unreadContacts = contacts.data?.filter((c) => !c.is_read).length ?? 0;
  const pendingBookings = bookings.data?.filter((b) => b.status === "pending").length ?? 0;
  const pendingOrders = orders.data?.filter((o) => o.status === "pending").length ?? 0;

  return (
    <div className="grain relative min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">Command center</div>
            <h1 className="mt-3 font-display text-5xl md:text-7xl">ADMIN.</h1>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex gap-3">
            <Link to="/dashboard" className="border border-border px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">My account</Link>
            <button onClick={() => signOut()} className="border border-border px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:border-foreground hover:text-foreground">Sign out</button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-px bg-border/40 md:grid-cols-5">
          <Stat label="Bookings" value={bookings.data?.length ?? 0} sub={`${pendingBookings} pending`} />
          <Stat label="Orders" value={orders.data?.length ?? 0} sub={`${pendingOrders} pending`} accent={pendingOrders > 0} />
          <Stat label="Products" value={products.data?.length ?? 0} />
          <Stat label="Leads" value={leads.data?.length ?? 0} />
          <Stat label="Messages" value={contacts.data?.length ?? 0} sub={`${unreadContacts} unread`} accent={unreadContacts > 0} />
        </div>

        <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-b border-border/40 font-mono text-[11px] uppercase tracking-[0.25em]">
          <TabButton active={tab === "bookings"} onClick={() => setTab("bookings")}>Bookings</TabButton>
          <TabButton active={tab === "orders"} onClick={() => setTab("orders")}>Orders</TabButton>
          <TabButton active={tab === "products"} onClick={() => setTab("products")}>Products</TabButton>
          <TabButton active={tab === "services"} onClick={() => setTab("services")}>Services</TabButton>
          <TabButton active={tab === "case_studies"} onClick={() => setTab("case_studies")}>Case studies</TabButton>
          <TabButton active={tab === "blog"} onClick={() => setTab("blog")}>Blog</TabButton>
          <TabButton active={tab === "testimonials"} onClick={() => setTab("testimonials")}>Testimonials</TabButton>
          <TabButton active={tab === "studio"} onClick={() => setTab("studio")}>Studio images</TabButton>
          <TabButton active={tab === "leads"} onClick={() => setTab("leads")}>Leads</TabButton>
          <TabButton active={tab === "contacts"} onClick={() => setTab("contacts")}>
            Messages {unreadContacts > 0 && <span className="ml-2 inline-flex h-4 min-w-4 items-center justify-center bg-imperium px-1 text-[9px] text-charleston">{unreadContacts}</span>}
          </TabButton>
          <TabButton active={tab === "payments"} onClick={() => setTab("payments")}>Payments</TabButton>
          <TabButton active={tab === "users"} onClick={() => setTab("users")}>
            Users {isSuperAdmin && <span className="ml-1 font-mono text-[8px] text-imperium">★</span>}
          </TabButton>
          <TabButton active={tab === "settings"} onClick={() => setTab("settings")}>Settings</TabButton>
        </div>

        {tab === "bookings" && (
          <div className="mt-8 space-y-px bg-border/40">
            {bookings.isLoading && <Empty>Loading…</Empty>}
            {bookings.data?.length === 0 && <Empty>No bookings yet</Empty>}
            {bookings.data?.map((b) => (
              <article key={b.id} className="bg-card p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                  <div className="md:col-span-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{format(new Date(b.preferred_date), "MMM d, yyyy")} · {b.preferred_time}</div>
                    <div className="mt-1 font-display text-xl">{b.full_name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{b.email}</div>
                    {b.phone && <div className="font-mono text-[10px] text-muted-foreground">{b.phone}</div>}
                  </div>
                  <div className="md:col-span-6">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-imperium">{b.services?.title ?? "General consultation"}</div>
                    {b.project_details && <p className="mt-2 text-sm text-muted-foreground">{b.project_details}</p>}
                  </div>
                  <div className="flex flex-col items-start gap-2 md:col-span-3 md:items-end">
                    <select value={b.status} onChange={(e) => updateBookingStatus(b.id, e.target.value)} className="border border-border bg-card px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] outline-none focus:border-imperium">
                      {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => deleteBooking(b.id)} className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-imperium"><Trash2 className="h-3 w-3" /> Delete</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "orders" && (
          <div className="mt-8">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="Search name, email, ref…" className="min-w-[220px] flex-1 border border-border bg-card px-3 py-2 font-mono text-[11px] outline-none focus:border-imperium" />
              <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)} className="border border-border bg-card px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] outline-none focus:border-imperium">
                <option value="all">All statuses</option>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={orderPayFilter} onChange={(e) => setOrderPayFilter(e.target.value)} className="border border-border bg-card px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] outline-none focus:border-imperium">
                <option value="all">All payment</option>
                {PAY_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div className="space-y-px bg-border/40">
              {orders.isLoading && <Empty>Loading…</Empty>}
              {(() => {
                const filtered = (orders.data ?? []).filter((o) => {
                  if (orderStatusFilter !== "all" && o.status !== orderStatusFilter) return false;
                  if (orderPayFilter !== "all" && o.payment_status !== orderPayFilter) return false;
                  if (orderSearch) {
                    const s = orderSearch.toLowerCase();
                    return [o.customer_name, o.customer_email, o.payment_ref, o.id]
                      .filter(Boolean).some((v) => String(v).toLowerCase().includes(s));
                  }
                  return true;
                });
                if (!orders.isLoading && filtered.length === 0) return <Empty>No orders match</Empty>;
                return filtered.map((o) => (
                  <article key={o.id} className="bg-card p-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                      <div className="md:col-span-3">
                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{format(new Date(o.created_at), "MMM d, yyyy HH:mm")}</div>
                        <div className="mt-1 font-display text-lg">#{o.id.slice(0, 8)}</div>
                        <div className="mt-2 text-sm">{o.customer_name}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{o.customer_email}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{o.customer_phone}</div>
                        {o.payment_ref && <div className="mt-1 font-mono text-[9px] text-muted-foreground">ref: {o.payment_ref}</div>}
                      </div>
                      <div className="md:col-span-5">
                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-imperium">Items</div>
                        <ul className="mt-1 space-y-0.5 text-sm">
                          {o.order_items?.map((it) => (
                            <li key={it.id} className="flex justify-between gap-4"><span>{it.title_snapshot} × {it.quantity}</span><span className="font-mono">{formatNaira(it.price_snapshot * it.quantity)}</span></li>
                          ))}
                        </ul>
                        <div className="mt-2 text-xs text-muted-foreground">{o.delivery_address}, {o.city}, {o.state}</div>
                        {o.notes && <div className="mt-2 text-xs italic text-muted-foreground">"{o.notes}"</div>}
                      </div>
                      <div className="flex flex-col items-start gap-2 md:col-span-4 md:items-end">
                        <div className="font-display text-2xl text-imperium">{formatNaira(o.total)}</div>
                        <select value={o.status} onChange={(e) => updateOrder(o.id, { status: e.target.value })} className="border border-border bg-card px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] outline-none focus:border-imperium">
                          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={o.payment_status} onChange={(e) => updateOrder(o.id, { payment_status: e.target.value })} className="border border-border bg-card px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] outline-none focus:border-imperium">
                          {PAY_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                        </select>
                        <RefundButton orderId={o.id} disabled={o.payment_status === "refunded"} />
                      </div>
                    </div>
                  </article>
                ));
              })()}
            </div>
          </div>
        )}

        {tab === "users" && <UsersAdmin isSuperAdmin={isSuperAdmin} />}
        {tab === "payments" && <PaymentsAdmin />}

        {tab === "products" && <ProductsAdmin products={products.data ?? []} onChange={() => qc.invalidateQueries({ queryKey: ["admin-products"] })} />}

        {tab === "blog" && <BlogAdmin />}
        {tab === "services" && <ServicesAdmin />}
        {tab === "case_studies" && <CaseStudiesAdmin />}
        {tab === "testimonials" && <TestimonialsAdmin />}
        {tab === "studio" && <StudioImagesAdmin />}
        {tab === "settings" && <SettingsAdmin />}

        {tab === "leads" && (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{leads.data?.length ?? 0} captured</span>
              <button onClick={exportLeadsCSV} className="inline-flex items-center gap-2 border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"><Download className="h-3 w-3" /> Export CSV</button>
            </div>
            <div className="space-y-px bg-border/40">
              {leads.data?.length === 0 && <Empty>No leads yet</Empty>}
              {leads.data?.map((l) => (
                <article key={l.id} className="bg-card p-5">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                    <div className="md:col-span-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{format(new Date(l.created_at), "MMM d, HH:mm")}</div>
                    <div className="md:col-span-3"><div className="font-display text-base">{l.name ?? "—"}</div><div className="font-mono text-[10px] text-muted-foreground">{l.email}</div>{l.phone && <div className="font-mono text-[10px] text-muted-foreground">{l.phone}</div>}</div>
                    <div className="md:col-span-3"><span className="border border-imperium/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-imperium">{l.source}</span>{l.interest && <div className="mt-1 text-xs text-muted-foreground">{l.interest}</div>}</div>
                    <div className="flex justify-end md:col-span-3"><button onClick={() => deleteLead(l.id)} className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-imperium"><Trash2 className="h-3 w-3" /> Delete</button></div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {tab === "contacts" && (
          <div className="mt-8 space-y-px bg-border/40">
            {contacts.isLoading && <Empty>Loading…</Empty>}
            {contacts.data?.length === 0 && <Empty>No messages yet</Empty>}
            {contacts.data?.map((c) => (
              <article key={c.id} className={cn("bg-card p-6", !c.is_read && "border-l-2 border-imperium")}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                  <div className="md:col-span-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{format(new Date(c.created_at), "MMM d, HH:mm")}</div>
                    <div className="mt-1 font-display text-lg">{c.name}</div>
                    <a href={`mailto:${c.email}`} className="font-mono text-[10px] text-muted-foreground hover:text-imperium">{c.email}</a>
                    {c.phone && <div className="font-mono text-[10px] text-muted-foreground">{c.phone}</div>}
                  </div>
                  <div className="md:col-span-6">
                    {c.subject && <div className="font-display text-base">{c.subject}</div>}
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{c.message}</p>
                  </div>
                  <div className="flex flex-col items-start gap-2 md:col-span-3 md:items-end">
                    <button onClick={() => markRead(c.id, !c.is_read)} className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">{c.is_read ? <><Mail className="h-3 w-3" /> Unread</> : <><Check className="h-3 w-3" /> Mark read</>}</button>
                    <button onClick={() => deleteContact(c.id)} className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-imperium"><Trash2 className="h-3 w-3" /> Delete</button>
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

interface ProductRow {
  id: string; slug: string; title: string; description: string | null;
  price: number; stock: number; is_active: boolean; is_featured: boolean;
  display_order: number; images: string[];
}

function ProductsAdmin({ products, onChange }: { products: ProductRow[]; onChange: () => void }) {
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [creating, setCreating] = useState(false);

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); onChange(); }
  };

  return (
    <div className="mt-8">
      <div className="mb-4 flex justify-end">
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 border border-imperium bg-imperium/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-imperium hover:bg-imperium hover:text-charleston"><Plus className="h-3 w-3" /> New product</button>
      </div>
      <div className="space-y-px bg-border/40">
        {products.length === 0 && <Empty>No products yet</Empty>}
        {products.map((p) => (
          <article key={p.id} className="bg-card p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-1">{p.images?.[0] && <img src={p.images[0]} alt={p.title} className="aspect-square w-full rounded object-cover" />}</div>
              <div className="md:col-span-5"><div className="font-display text-lg">{p.title}</div><div className="font-mono text-[10px] text-muted-foreground">/{p.slug}</div><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p></div>
              <div className="md:col-span-2 font-display text-lg text-imperium">{formatNaira(p.price)}</div>
              <div className="md:col-span-2 font-mono text-[11px] text-muted-foreground">Stock: {p.stock}<br />{p.is_active ? "Active" : "Hidden"}{p.is_featured && " · ★"}</div>
              <div className="flex flex-col items-start gap-2 md:col-span-2 md:items-end">
                <button onClick={() => setEditing(p)} className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"><Pencil className="h-3 w-3" /> Edit</button>
                <button onClick={() => remove(p.id)} className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-imperium"><Trash2 className="h-3 w-3" /> Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {(editing || creating) && (
        <ProductForm
          initial={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); onChange(); }}
        />
      )}
    </div>
  );
}

function ProductForm({ initial, onClose, onSaved }: { initial: ProductRow | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [stock, setStock] = useState(initial?.stock ?? 0);
  const [imageUrl, setImageUrl] = useState(initial?.images?.[0] ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? false);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!title.trim() || !slug.trim()) { toast.error("Title and slug are required"); return; }
    setBusy(true);
    const payload = {
      title: title.trim(),
      slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
      description: description || null,
      price: Math.max(0, Math.round(price)),
      stock: Math.max(0, Math.round(stock)),
      images: imageUrl ? [imageUrl] : [],
      is_active: isActive,
      is_featured: isFeatured,
    };
    const q = initial
      ? supabase.from("products").update(payload).eq("id", initial.id)
      : supabase.from("products").insert(payload);
    const { error } = await q;
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(initial ? "Updated" : "Created"); onSaved(); }
  };

  const inp = "w-full rounded border border-border bg-card px-3 py-2 text-sm outline-none focus:border-imperium";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur" onClick={onClose}>
      <div className="w-full max-w-xl rounded-lg border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-2xl">{initial ? "Edit product" : "New product"}</h3>
        <div className="mt-5 space-y-3">
          <input className={inp} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className={inp} placeholder="slug-like-this" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <textarea className={`${inp} resize-none`} rows={3} placeholder="Description" value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className={inp} type="number" placeholder="Price (NGN)" value={price} onChange={(e) => setPrice(+e.target.value)} />
            <input className={inp} type="number" placeholder="Stock" value={stock} onChange={(e) => setStock(+e.target.value)} />
          </div>
          <input className={inp} placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          <div className="flex gap-5 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} /> Featured</label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em]">Cancel</button>
          <button onClick={save} disabled={busy} className="border border-imperium bg-imperium px-5 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-charleston disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="bg-card p-12 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{children}</div>;
}

// ===== Blog admin =====
interface BlogRow {
  id: string; slug: string; title: string; excerpt: string | null;
  cover_image: string | null; body: string; author: string | null;
  tags: string[]; is_published: boolean; display_order: number;
  published_at: string | null;
}

function BlogAdmin() {
  const qc = useQueryClient();
  const { data: posts } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as BlogRow[];
    },
  });
  const [editing, setEditing] = useState<BlogRow | null>(null);
  const [creating, setCreating] = useState(false);

  const remove = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-blog"] }); }
  };

  return (
    <div className="mt-8">
      <div className="mb-4 flex justify-end">
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 border border-imperium bg-imperium/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-imperium hover:bg-imperium hover:text-charleston">
          <Plus className="h-3 w-3" /> New post
        </button>
      </div>
      <div className="space-y-px bg-border/40">
        {(!posts || posts.length === 0) && <Empty>No posts yet</Empty>}
        {posts?.map((p) => (
          <article key={p.id} className="bg-card p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="md:col-span-1">
                {p.cover_image && <img src={p.cover_image} alt={p.title} className="aspect-square w-full rounded object-cover" />}
              </div>
              <div className="md:col-span-7">
                <div className="font-display text-lg">{p.title}</div>
                <div className="font-mono text-[10px] text-muted-foreground">/blog/{p.slug}</div>
                {p.excerpt && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.excerpt}</p>}
              </div>
              <div className="md:col-span-2 font-mono text-[11px] text-muted-foreground">
                {p.is_published ? <span className="text-imperium">Published</span> : "Draft"}
                {p.tags?.[0] && <div>#{p.tags[0]}</div>}
              </div>
              <div className="flex flex-col items-start gap-2 md:col-span-2 md:items-end">
                <button onClick={() => setEditing(p)} className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"><Pencil className="h-3 w-3" /> Edit</button>
                <button onClick={() => remove(p.id)} className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-imperium"><Trash2 className="h-3 w-3" /> Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {(editing || creating) && (
        <BlogForm
          initial={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); qc.invalidateQueries({ queryKey: ["admin-blog"] }); qc.invalidateQueries({ queryKey: ["blog-posts-home"] }); qc.invalidateQueries({ queryKey: ["blog-posts-all"] }); }}
        />
      )}
    </div>
  );
}

function BlogForm({ initial, onClose, onSaved }: { initial: BlogRow | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [cover, setCover] = useState(initial?.cover_image ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "C Imperium");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? false);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!title.trim() || !slug.trim()) return toast.error("Title and slug required");
    setBusy(true);
    const payload = {
      title: title.trim(),
      slug: slug.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      excerpt: excerpt || null,
      cover_image: cover || null,
      body,
      author: author || null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      is_published: isPublished,
      published_at: isPublished ? (initial?.published_at ?? new Date().toISOString()) : null,
    };
    const q = initial
      ? supabase.from("blog_posts").update(payload).eq("id", initial.id)
      : supabase.from("blog_posts").insert(payload);
    const { error } = await q;
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(initial ? "Updated" : "Created"); onSaved(); }
  };

  const inp = "w-full rounded border border-border bg-card px-3 py-2 text-sm outline-none focus:border-imperium";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-2xl">{initial ? "Edit post" : "New post"}</h3>
        <div className="mt-5 space-y-3">
          <input className={inp} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className={inp} placeholder="slug-like-this" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <textarea className={`${inp} resize-none`} rows={2} placeholder="Short excerpt (1–2 sentences)" value={excerpt ?? ""} onChange={(e) => setExcerpt(e.target.value)} />
          <input className={inp} placeholder="Cover image URL" value={cover ?? ""} onChange={(e) => setCover(e.target.value)} />
          <textarea className={`${inp} resize-none`} rows={10} placeholder="Article body (plain text, line breaks preserved)" value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className={inp} placeholder="Author" value={author ?? ""} onChange={(e) => setAuthor(e.target.value)} />
            <input className={inp} placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} /> Published</label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em]">Cancel</button>
          <button onClick={save} disabled={busy} className="border border-imperium bg-imperium px-5 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-charleston disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

// ===== Settings admin (site_settings key/value rows) =====
function SettingsAdmin() {
  const qc = useQueryClient();
  const { data: rows } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").order("key");
      if (error) throw error;
      return data as { key: string; value: unknown }[];
    },
  });
  const [draft, setDraft] = useState<Record<string, string>>({});

  const get = (k: string) => {
    if (draft[k] !== undefined) return draft[k];
    const r = rows?.find((x) => x.key === k);
    if (!r) return "";
    return typeof r.value === "string" ? r.value : JSON.stringify(r.value);
  };
  const set = (k: string, v: string) => setDraft((d) => ({ ...d, [k]: v }));

  const save = async (key: string, asJson: boolean) => {
    const raw = get(key);
    let value: unknown = raw;
    if (asJson) {
      try { value = JSON.parse(raw); } catch { toast.error(`${key}: invalid JSON`); return; }
    }
    const { error } = await supabase.from("site_settings").upsert({ key, value: value as never }, { onConflict: "key" });
    if (error) toast.error(error.message);
    else { toast.success(`${key} saved`); qc.invalidateQueries({ queryKey: ["admin-settings"] }); qc.invalidateQueries({ queryKey: ["site-settings"] }); setDraft((d) => { const n = { ...d }; delete n[key]; return n; }); }
  };

  const inp = "w-full rounded border border-border bg-card px-3 py-2 text-sm outline-none focus:border-imperium";

  return (
    <div className="mt-8 space-y-6">
      <Field label="WhatsApp orders number" hint="International format, e.g. +2348038577654">
        <div className="flex gap-2">
          <input className={inp} value={get("whatsapp_number").replace(/^"|"$/g, "")} onChange={(e) => set("whatsapp_number", JSON.stringify(e.target.value))} />
          <SaveBtn onClick={() => save("whatsapp_number", true)} />
        </div>
      </Field>

      <Field label="Contact email">
        <div className="flex gap-2">
          <input className={inp} value={get("contact_email").replace(/^"|"$/g, "")} onChange={(e) => set("contact_email", JSON.stringify(e.target.value))} />
          <SaveBtn onClick={() => save("contact_email", true)} />
        </div>
      </Field>

      <Field label="Payment provider" hint="paystack · flutterwave · manual · off">
        <div className="flex gap-2">
          <select className={inp} value={get("payment_provider").replace(/^"|"$/g, "")} onChange={(e) => set("payment_provider", JSON.stringify(e.target.value))}>
            {["paystack","flutterwave","manual","off"].map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <SaveBtn onClick={() => save("payment_provider", true)} />
        </div>
      </Field>

      <Field label="Payment mode" hint="test or live">
        <div className="flex gap-2">
          <select className={inp} value={get("payment_mode").replace(/^"|"$/g, "")} onChange={(e) => set("payment_mode", JSON.stringify(e.target.value))}>
            {["test","live"].map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <SaveBtn onClick={() => save("payment_mode", true)} />
        </div>
      </Field>

      <Field label="Socials (JSON)" hint='e.g. {"instagram":"https://...","linkedin":"...","behance":"..."}'>
        <textarea className={`${inp} resize-none font-mono text-xs`} rows={4} value={get("socials")} onChange={(e) => set("socials", e.target.value)} />
        <SaveBtn onClick={() => save("socials", true)} className="mt-2" />
      </Field>

      <Field label="Hero section (JSON)" hint='Eyebrow, headline lines and subline'>
        <textarea className={`${inp} resize-none font-mono text-xs`} rows={8} value={get("hero")} onChange={(e) => set("hero", e.target.value)} />
        <SaveBtn onClick={() => save("hero", true)} className="mt-2" />
      </Field>

      <div className="rounded-md border border-border/60 bg-card p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-imperium">Live API keys</div>
        <p className="mt-2 text-sm text-muted-foreground">
          Payment provider secret keys (Paystack/Flutterwave) are stored in the secured Secrets vault — not in this table — and never reach the browser. Once provided, this admin panel toggles between test and live mode above. To rotate the keys, use Project → Secrets.
        </p>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
      {hint && <div className="text-[11px] text-muted-foreground/70">{hint}</div>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function SaveBtn({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={cn("shrink-0 border border-imperium bg-imperium/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-imperium hover:bg-imperium hover:text-charleston", className)}>
      Save
    </button>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: number; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-card p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
      <div className={cn("mt-2 font-display text-4xl", accent ? "text-imperium" : "text-foreground")}>{value}</div>
      {sub && <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("relative -mb-px border-b-2 pb-4 transition-colors", active ? "border-imperium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>{children}</button>
  );
}

// ---------- Refund + Users + Payments ----------
import { refundOrder, listUsers, grantRole, revokeRole, sendPasswordReset, paystackProbe } from "@/lib/admin.functions";

function RefundButton({ orderId, disabled }: { orderId: string; disabled?: boolean }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const onClick = async () => {
    if (!confirm("Issue a refund for this order? If it was paid via Paystack we'll call their refund API; otherwise it is marked as refunded manually.")) return;
    setBusy(true);
    try {
      const res = await refundOrder({ data: { orderId } });
      toast.success(res.mode === "paystack" ? "Paystack refund queued" : "Order marked refunded");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Refund failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <button onClick={onClick} disabled={disabled || busy} className="border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:border-imperium hover:text-imperium disabled:opacity-40">
      {busy ? "…" : "Refund"}
    </button>
  );
}

function UsersAdmin({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const qc = useQueryClient();
  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => await listUsers(),
  });
  const [search, setSearch] = useState("");

  const toggle = async (userId: string, role: "admin" | "staff" | "customer" | "super_admin", have: boolean) => {
    try {
      if (have) await revokeRole({ data: { userId, role } });
      else await grantRole({ data: { userId, role } });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Roles updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const reset = async (email: string) => {
    try {
      await sendPasswordReset({ data: { email, redirectTo: `${window.location.origin}/reset-password` } });
      toast.success(`Recovery link sent to ${email}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const filtered = (users.data ?? []).filter((u) => !search || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mt-8">
      {!isSuperAdmin && (
        <div className="mb-4 border border-imperium/40 bg-imperium/5 p-3 font-mono text-[10px] uppercase tracking-[0.2em] text-imperium">
          Read-only · super_admin required to change roles or send resets
        </div>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search email…" className="min-w-[240px] flex-1 border border-border bg-card px-3 py-2 font-mono text-[11px] outline-none focus:border-imperium" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{filtered.length} users</span>
      </div>
      <div className="space-y-px bg-border/40">
        {users.isLoading && <Empty>Loading…</Empty>}
        {!users.isLoading && filtered.length === 0 && <Empty>No users</Empty>}
        {filtered.map((u) => {
          const has = (r: string) => u.roles.includes(r);
          return (
            <article key={u.id} className="bg-card p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="md:col-span-4">
                  <div className="font-display text-base">{u.email}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">joined {format(new Date(u.created_at), "MMM d, yyyy")}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">last seen {u.last_sign_in_at ? format(new Date(u.last_sign_in_at), "MMM d, HH:mm") : "—"}</div>
                </div>
                <div className="md:col-span-5">
                  <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Roles</div>
                  <div className="flex flex-wrap gap-2">
                    {(["super_admin", "admin", "staff", "customer"] as const).map((r) => (
                      <button
                        key={r}
                        disabled={!isSuperAdmin}
                        onClick={() => toggle(u.id, r, has(r))}
                        className={cn(
                          "border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors",
                          has(r) ? "border-imperium bg-imperium text-charleston" : "border-border text-muted-foreground hover:border-foreground",
                          !isSuperAdmin && "opacity-50 cursor-not-allowed",
                        )}
                      >
                        {r.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex md:col-span-3 md:justify-end">
                  <button
                    disabled={!isSuperAdmin}
                    onClick={() => reset(u.email)}
                    className="inline-flex items-center gap-2 border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:border-imperium hover:text-imperium disabled:opacity-40"
                  >
                    <Mail className="h-3 w-3" /> Send reset
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function PaymentsAdmin() {
  const qc = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ["admin-payment-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").in("key", ["paystack", "payment_provider", "payment_mode", "termii"]);
      if (error) throw error;
      return data as { key: string; value: any }[];
    },
  });
  const paystack = (settings?.find((s) => s.key === "paystack")?.value as { public_key_test?: string; public_key_live?: string; mode?: string } | undefined) ?? {};
  const termii = (settings?.find((s) => s.key === "termii")?.value as { enabled?: boolean; whatsapp?: boolean; sms?: boolean; sender_id?: string } | undefined) ?? {};

  const [ps, setPs] = useState<{ mode: string; public_key_test: string; public_key_live: string }>({
    mode: paystack.mode ?? "test",
    public_key_test: paystack.public_key_test ?? "",
    public_key_live: paystack.public_key_live ?? "",
  });
  const [tm, setTm] = useState({
    enabled: !!termii.enabled,
    whatsapp: !!termii.whatsapp,
    sms: !!termii.sms,
    sender_id: termii.sender_id ?? "CImperium",
  });
  const [probeEmail, setProbeEmail] = useState("");
  const [probeUrl, setProbeUrl] = useState<string | null>(null);
  const [probing, setProbing] = useState(false);

  // sync state when server data arrives
  const syncedRef = { current: false } as { current: boolean };
  if (!syncedRef.current && settings) {
    // Only apply once — noop after first paint
  }

  const savePaystack = async () => {
    const { error } = await supabase.from("site_settings").upsert({ key: "paystack", value: ps as never }, { onConflict: "key" });
    if (error) toast.error(error.message);
    else {
      toast.success("Paystack settings saved");
      qc.invalidateQueries({ queryKey: ["admin-payment-settings"] });
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    }
  };

  const saveTermii = async () => {
    const { error } = await supabase.from("site_settings").upsert({ key: "termii", value: tm as never }, { onConflict: "key" });
    if (error) toast.error(error.message);
    else {
      toast.success("Termii settings saved");
      qc.invalidateQueries({ queryKey: ["admin-payment-settings"] });
    }
  };

  const runProbe = async () => {
    if (!probeEmail) { toast.error("Enter an email"); return; }
    setProbing(true);
    setProbeUrl(null);
    try {
      const res = await paystackProbe({ data: { email: probeEmail } });
      setProbeUrl(res.authorizationUrl);
      toast.success(`Test ₦100 initialized (${res.reference})`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Probe failed");
    } finally {
      setProbing(false);
    }
  };

  const webhookUrl = typeof window !== "undefined" ? `${window.location.origin}/api/public/paystack-webhook` : "";
  const inp = "w-full border border-border bg-card px-3 py-2 text-sm outline-none focus:border-imperium";

  return (
    <div className="mt-8 space-y-8">
      <section className="border border-border/60 bg-card p-6">
        <h3 className="font-display text-2xl">Paystack</h3>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Server keeps secret keys · public keys shown to browser</p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Mode">
            <select value={ps.mode} onChange={(e) => setPs((p) => ({ ...p, mode: e.target.value }))} className={inp}>
              <option value="test">test</option>
              <option value="live">live</option>
            </select>
          </Field>
          <Field label="Currency"><input disabled value="NGN" className={cn(inp, "opacity-60")} /></Field>
          <Field label="Public key — test" hint="pk_test_...">
            <input value={ps.public_key_test} onChange={(e) => setPs((p) => ({ ...p, public_key_test: e.target.value }))} className={inp} />
          </Field>
          <Field label="Public key — live" hint="pk_live_...">
            <input value={ps.public_key_live} onChange={(e) => setPs((p) => ({ ...p, public_key_live: e.target.value }))} className={inp} />
          </Field>
        </div>
        <SaveBtn className="mt-4" onClick={savePaystack} />

        <div className="mt-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Webhook URL</div>
          <div className="mt-1 flex gap-2">
            <input readOnly value={webhookUrl} className={cn(inp, "font-mono text-xs")} />
            <button onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("Copied"); }} className="border border-border px-3 font-mono text-[10px] uppercase tracking-[0.2em] hover:border-foreground">Copy</button>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Paste this into Paystack → Settings → API Keys & Webhooks.</p>
        </div>

        <div className="mt-6 border-t border-border/60 pt-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-imperium">Send test ₦100 probe</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Initializes a live transaction against your test secret key.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input value={probeEmail} onChange={(e) => setProbeEmail(e.target.value)} placeholder="probe@example.com" className={cn(inp, "max-w-xs")} />
            <button onClick={runProbe} disabled={probing} className="border border-imperium bg-imperium/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-imperium hover:bg-imperium hover:text-charleston disabled:opacity-50">{probing ? "…" : "Run probe"}</button>
          </div>
          {probeUrl && (
            <a href={probeUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block break-all font-mono text-xs text-imperium underline">
              Open Paystack checkout →
            </a>
          )}
        </div>
      </section>

      <section className="border border-border/60 bg-card p-6">
        <h3 className="font-display text-2xl">Termii — WhatsApp / SMS</h3>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">OTP + transactional messaging channels</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={tm.enabled} onChange={(e) => setTm((t) => ({ ...t, enabled: e.target.checked }))} />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em]">Termii enabled</span>
          </label>
          <Field label="Sender ID">
            <input value={tm.sender_id} onChange={(e) => setTm((t) => ({ ...t, sender_id: e.target.value }))} className={inp} />
          </Field>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={tm.whatsapp} onChange={(e) => setTm((t) => ({ ...t, whatsapp: e.target.checked }))} />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em]">WhatsApp channel</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={tm.sms} onChange={(e) => setTm((t) => ({ ...t, sms: e.target.checked }))} />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em]">SMS channel</span>
          </label>
        </div>
        <SaveBtn className="mt-4" onClick={saveTermii} />
        <p className="mt-3 text-[11px] text-muted-foreground">Termii API key lives in Secrets vault (TERMII_API_KEY). Toggle channels here and the send-OTP server function will honour them.</p>
      </section>
    </div>
  );
}

// ================= Testimonials =================
interface TestimonialRow {
  id: string; name: string; role: string | null; company: string | null;
  quote: string; rating: number | null; avatar_url: string | null;
  display_order: number; is_published: boolean;
}

function TestimonialsAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("testimonials").select("*").order("display_order");
      if (error) throw error;
      return data as TestimonialRow[];
    },
  });
  const [editing, setEditing] = useState<TestimonialRow | null>(null);
  const [creating, setCreating] = useState(false);
  const remove = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-testimonials"] }); }
  };
  return (
    <div className="mt-8">
      <div className="mb-4 flex justify-end">
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 border border-imperium bg-imperium/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-imperium hover:bg-imperium hover:text-charleston"><Plus className="h-3 w-3" /> New testimonial</button>
      </div>
      <div className="space-y-px bg-border/40">
        {(!data || data.length === 0) && <Empty>No testimonials yet</Empty>}
        {data?.map((t) => (
          <article key={t.id} className="bg-card p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="md:col-span-1">{t.avatar_url && <img src={t.avatar_url} alt={t.name} className="aspect-square w-full rounded-full object-cover" />}</div>
              <div className="md:col-span-7">
                <div className="font-display text-lg">{t.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{[t.role, t.company].filter(Boolean).join(" · ") || "—"}</div>
                <p className="mt-1 line-clamp-2 text-sm italic text-muted-foreground">"{t.quote}"</p>
              </div>
              <div className="md:col-span-2 font-mono text-[11px] text-muted-foreground">
                {"★".repeat(t.rating ?? 5)}<br />
                {t.is_published ? <span className="text-imperium">Published</span> : "Draft"} · #{t.display_order}
              </div>
              <div className="flex flex-col items-start gap-2 md:col-span-2 md:items-end">
                <button onClick={() => setEditing(t)} className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"><Pencil className="h-3 w-3" /> Edit</button>
                <button onClick={() => remove(t.id)} className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-imperium"><Trash2 className="h-3 w-3" /> Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {(editing || creating) && (
        <TestimonialForm
          initial={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); qc.invalidateQueries({ queryKey: ["admin-testimonials"] }); }}
        />
      )}
    </div>
  );
}

function TestimonialForm({ initial, onClose, onSaved }: { initial: TestimonialRow | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [quote, setQuote] = useState(initial?.quote ?? "");
  const [rating, setRating] = useState(initial?.rating ?? 5);
  const [avatar, setAvatar] = useState(initial?.avatar_url ?? "");
  const [order, setOrder] = useState(initial?.display_order ?? 0);
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? true);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!name.trim() || !quote.trim()) { toast.error("Name and quote are required"); return; }
    setBusy(true);
    const payload = {
      name: name.trim(),
      role: role ?? "",
      company: company ?? "",
      quote: quote.trim(),
      rating: Math.min(5, Math.max(1, Math.round(rating))),
      avatar_url: avatar || null,
      display_order: Math.round(order),
      is_published: isPublished,
    };
    const q = initial
      ? supabase.from("testimonials").update(payload).eq("id", initial.id)
      : supabase.from("testimonials").insert(payload);
    const { error } = await q;
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(initial ? "Updated" : "Created"); onSaved(); }
  };
  const inp = "w-full rounded border border-border bg-card px-3 py-2 text-sm outline-none focus:border-imperium";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-2xl">{initial ? "Edit testimonial" : "New testimonial"}</h3>
        <div className="mt-5 space-y-3">
          <input className={inp} placeholder="Client name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className={inp} placeholder="Role (e.g. Founder)" value={role ?? ""} onChange={(e) => setRole(e.target.value)} />
            <input className={inp} placeholder="Company" value={company ?? ""} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <textarea className={`${inp} resize-none`} rows={4} placeholder="Quote" value={quote} onChange={(e) => setQuote(e.target.value)} />
          <input className={inp} placeholder="Avatar URL (optional)" value={avatar ?? ""} onChange={(e) => setAvatar(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className={inp} type="number" min={1} max={5} placeholder="Rating (1–5)" value={rating} onChange={(e) => setRating(+e.target.value)} />
            <input className={inp} type="number" placeholder="Display order" value={order} onChange={(e) => setOrder(+e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} /> Published</label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em]">Cancel</button>
          <button onClick={save} disabled={busy} className="border border-imperium bg-imperium px-5 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-charleston disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

// ================= Studio Images =================
interface StudioRow { id: string; url: string; alt: string | null; display_order: number; is_active: boolean }

function StudioImagesAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-studio"],
    queryFn: async () => {
      const { data, error } = await supabase.from("studio_images").select("*").order("display_order");
      if (error) throw error;
      return data as StudioRow[];
    },
  });
  const [editing, setEditing] = useState<StudioRow | null>(null);
  const [creating, setCreating] = useState(false);
  const remove = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    const { error } = await supabase.from("studio_images").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-studio"] }); }
  };
  const toggle = async (row: StudioRow) => {
    const { error } = await supabase.from("studio_images").update({ is_active: !row.is_active }).eq("id", row.id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin-studio"] });
  };
  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Powers the About section gallery · lower display order shows first</p>
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 border border-imperium bg-imperium/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-imperium hover:bg-imperium hover:text-charleston"><Plus className="h-3 w-3" /> Add image</button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(!data || data.length === 0) && <div className="col-span-full"><Empty>No studio images yet</Empty></div>}
        {data?.map((row) => (
          <div key={row.id} className={cn("group relative overflow-hidden border border-border bg-card", !row.is_active && "opacity-40")}>
            <img src={row.url} alt={row.alt ?? ""} className="aspect-square w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-background/80 p-2 backdrop-blur">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">#{row.display_order}</span>
              <div className="flex gap-2">
                <button onClick={() => toggle(row)} className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">{row.is_active ? "Hide" : "Show"}</button>
                <button onClick={() => setEditing(row)} className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"><Pencil className="h-3 w-3" /></button>
                <button onClick={() => remove(row.id)} className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-imperium"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {(editing || creating) && (
        <StudioImageForm
          initial={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); qc.invalidateQueries({ queryKey: ["admin-studio"] }); }}
        />
      )}
    </div>
  );
}

function StudioImageForm({ initial, onClose, onSaved }: { initial: StudioRow | null; onClose: () => void; onSaved: () => void }) {
  const [url, setUrl] = useState(initial?.url ?? "");
  const [alt, setAlt] = useState(initial?.alt ?? "");
  const [order, setOrder] = useState(initial?.display_order ?? 0);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const onFile = async (file: File) => {
    setUploading(true);
    try {
      const path = `studio/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("site-media").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: signed, error: signErr } = await supabase.storage.from("site-media").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signErr) throw signErr;
      setUrl(signed.signedUrl);
      toast.success("Uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!url.trim()) { toast.error("Image URL is required"); return; }
    setBusy(true);
    const payload = { url: url.trim(), alt: alt || null, display_order: Math.round(order), is_active: isActive };
    const q = initial
      ? supabase.from("studio_images").update(payload).eq("id", initial.id)
      : supabase.from("studio_images").insert(payload);
    const { error } = await q;
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(initial ? "Updated" : "Created"); onSaved(); }
  };

  const inp = "w-full rounded border border-border bg-card px-3 py-2 text-sm outline-none focus:border-imperium";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-2xl">{initial ? "Edit image" : "Add studio image"}</h3>
        <div className="mt-5 space-y-3">
          <div>
            <label className="inline-flex cursor-pointer items-center gap-2 border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
              {uploading ? "Uploading…" : "Upload from device"}
            </label>
            <span className="ml-3 text-[11px] text-muted-foreground">or paste a URL below</span>
          </div>
          <input className={inp} placeholder="Image URL" value={url} onChange={(e) => setUrl(e.target.value)} />
          {url && <img src={url} alt="preview" className="max-h-48 rounded border border-border object-cover" />}
          <input className={inp} placeholder="Alt text (accessibility)" value={alt ?? ""} onChange={(e) => setAlt(e.target.value)} />
          <input className={inp} type="number" placeholder="Display order" value={order} onChange={(e) => setOrder(+e.target.value)} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active (show on site)</label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em]">Cancel</button>
          <button onClick={save} disabled={busy || uploading} className="border border-imperium bg-imperium px-5 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-charleston disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}


// ================= Services =================
interface ServiceRow {
  id: string; slug: string; title: string; description: string; icon: string;
  price_min: number | null; price_max: number | null; features: string[];
  display_order: number; is_active: boolean;
}

function ServicesAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("display_order");
      if (error) throw error;
      return data as ServiceRow[];
    },
  });
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [creating, setCreating] = useState(false);
  const remove = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-services"] }); }
  };
  const toggle = async (row: ServiceRow) => {
    const { error } = await supabase.from("services").update({ is_active: !row.is_active }).eq("id", row.id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin-services"] });
  };
  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Editable service cards · lower display order shows first</p>
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 border border-imperium bg-imperium/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-imperium hover:bg-imperium hover:text-charleston"><Plus className="h-3 w-3" /> Add service</button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {(!data || data.length === 0) && <div className="md:col-span-2"><Empty>No services yet</Empty></div>}
        {data?.map((row) => (
          <div key={row.id} className={cn("border border-border bg-card p-4", !row.is_active && "opacity-50")}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-display text-lg">{row.title}</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">/{row.slug} · #{row.display_order}</div>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{row.description}</p>
                {(row.price_min || row.price_max) && (
                  <div className="mt-2 text-xs text-foreground">
                    {row.price_min ? formatNaira(row.price_min) : "—"} – {row.price_max ? formatNaira(row.price_max) : "—"}
                  </div>
                )}
                {row.features?.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {row.features.slice(0, 3).map((f, i) => <li key={i}>· {f}</li>)}
                  </ul>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => toggle(row)} className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">{row.is_active ? "Hide" : "Show"}</button>
                <button onClick={() => setEditing(row)} className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"><Pencil className="h-3 w-3" /></button>
                <button onClick={() => remove(row.id)} className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-imperium"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {(editing || creating) && (
        <ServiceForm
          initial={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); qc.invalidateQueries({ queryKey: ["admin-services"] }); }}
        />
      )}
    </div>
  );
}

function ServiceForm({ initial, onClose, onSaved }: { initial: ServiceRow | null; onClose: () => void; onSaved: () => void }) {
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "");
  const [priceMin, setPriceMin] = useState<string>(initial?.price_min?.toString() ?? "");
  const [priceMax, setPriceMax] = useState<string>(initial?.price_max?.toString() ?? "");
  const [features, setFeatures] = useState((initial?.features ?? []).join("\n"));
  const [order, setOrder] = useState(initial?.display_order ?? 0);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!slug.trim() || !title.trim() || !description.trim() || !icon.trim()) {
      return toast.error("Slug, title, description and icon are required");
    }
    setBusy(true);
    const payload = {
      slug: slug.trim(), title: title.trim(), description: description.trim(), icon: icon.trim(),
      price_min: priceMin ? parseInt(priceMin, 10) : null,
      price_max: priceMax ? parseInt(priceMax, 10) : null,
      features: features.split("\n").map((s) => s.trim()).filter(Boolean),
      display_order: Math.round(order), is_active: isActive,
    };
    const q = initial
      ? supabase.from("services").update(payload).eq("id", initial.id)
      : supabase.from("services").insert(payload);
    const { error } = await q;
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(initial ? "Updated" : "Created"); onSaved(); }
  };

  const inp = "w-full rounded border border-border bg-card px-3 py-2 text-sm outline-none focus:border-imperium";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-2xl">{initial ? "Edit service" : "New service"}</h3>
        <div className="mt-5 space-y-3">
          <input className={inp} placeholder="Slug (e.g. brand-identity)" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <input className={inp} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className={inp} rows={3} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <input className={inp} placeholder="Icon name (lucide, e.g. palette)" value={icon} onChange={(e) => setIcon(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input className={inp} type="number" placeholder="Price min (NGN)" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
            <input className={inp} type="number" placeholder="Price max (NGN)" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
          </div>
          <textarea className={inp} rows={4} placeholder="Features (one per line)" value={features} onChange={(e) => setFeatures(e.target.value)} />
          <input className={inp} type="number" placeholder="Display order" value={order} onChange={(e) => setOrder(+e.target.value)} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active</label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em]">Cancel</button>
          <button onClick={save} disabled={busy} className="border border-imperium bg-imperium px-5 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-charleston disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

// ================= Case Studies =================
interface CaseStudyRow {
  id: string; slug: string; title: string; client: string; industry: string;
  cover_image: string | null; challenge: string | null; solution: string | null; results: string | null;
  is_featured: boolean; display_order: number; gallery_images: string[];
}

function CaseStudiesAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-case-studies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("case_studies").select("*").order("display_order");
      if (error) throw error;
      return data as CaseStudyRow[];
    },
  });
  const [editing, setEditing] = useState<CaseStudyRow | null>(null);
  const [creating, setCreating] = useState(false);
  const remove = async (id: string) => {
    if (!confirm("Delete this case study?")) return;
    const { error } = await supabase.from("case_studies").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-case-studies"] }); }
  };
  const toggleFeatured = async (row: CaseStudyRow) => {
    const { error } = await supabase.from("case_studies").update({ is_featured: !row.is_featured }).eq("id", row.id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin-case-studies"] });
  };
  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Portfolio work · featured items surface in the portfolio section</p>
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 border border-imperium bg-imperium/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-imperium hover:bg-imperium hover:text-charleston"><Plus className="h-3 w-3" /> Add case study</button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(!data || data.length === 0) && <div className="md:col-span-2 xl:col-span-3"><Empty>No case studies yet</Empty></div>}
        {data?.map((row) => (
          <div key={row.id} className="overflow-hidden border border-border bg-card">
            {row.cover_image && <img src={row.cover_image} alt={row.title} className="aspect-[4/3] w-full object-cover" />}
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display text-lg">{row.title}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{row.client} · {row.industry} · #{row.display_order}</div>
                  {row.is_featured && <span className="mt-2 inline-block border border-imperium px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-imperium">Featured</span>}
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => toggleFeatured(row)} className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">{row.is_featured ? "Unfeature" : "Feature"}</button>
                  <button onClick={() => setEditing(row)} className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"><Pencil className="h-3 w-3" /></button>
                  <button onClick={() => remove(row.id)} className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-imperium"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {(editing || creating) && (
        <CaseStudyForm
          initial={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); qc.invalidateQueries({ queryKey: ["admin-case-studies"] }); }}
        />
      )}
    </div>
  );
}

function CaseStudyForm({ initial, onClose, onSaved }: { initial: CaseStudyRow | null; onClose: () => void; onSaved: () => void }) {
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [client, setClient] = useState(initial?.client ?? "");
  const [industry, setIndustry] = useState(initial?.industry ?? "");
  const [cover, setCover] = useState(initial?.cover_image ?? "");
  const [challenge, setChallenge] = useState(initial?.challenge ?? "");
  const [solution, setSolution] = useState(initial?.solution ?? "");
  const [results, setResults] = useState(initial?.results ?? "");
  const [gallery, setGallery] = useState((initial?.gallery_images ?? []).join("\n"));
  const [order, setOrder] = useState(initial?.display_order ?? 0);
  const [featured, setFeatured] = useState(initial?.is_featured ?? false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<null | "cover" | "gallery">(null);

  const uploadOne = async (file: File): Promise<string> => {
    const path = `case-studies/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("site-media").upload(path, file, { upsert: false });
    if (upErr) throw upErr;
    const { data: signed, error: signErr } = await supabase.storage.from("site-media").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (signErr) throw signErr;
    return signed.signedUrl;
  };

  const onCoverFile = async (file: File) => {
    setUploading("cover");
    try { setCover(await uploadOne(file)); toast.success("Uploaded"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); }
    finally { setUploading(null); }
  };
  const onGalleryFile = async (file: File) => {
    setUploading("gallery");
    try {
      const url = await uploadOne(file);
      setGallery((g) => (g ? g + "\n" + url : url));
      toast.success("Added to gallery");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); }
    finally { setUploading(null); }
  };

  const save = async () => {
    if (!slug.trim() || !title.trim() || !client.trim() || !industry.trim()) {
      return toast.error("Slug, title, client and industry are required");
    }
    setBusy(true);
    const payload = {
      slug: slug.trim(), title: title.trim(), client: client.trim(), industry: industry.trim(),
      cover_image: cover.trim() || null,
      challenge: challenge.trim() || null,
      solution: solution.trim() || null,
      results: results.trim() || null,
      gallery_images: gallery.split("\n").map((s) => s.trim()).filter(Boolean),
      display_order: Math.round(order), is_featured: featured,
    };
    const q = initial
      ? supabase.from("case_studies").update(payload).eq("id", initial.id)
      : supabase.from("case_studies").insert(payload);
    const { error } = await q;
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(initial ? "Updated" : "Created"); onSaved(); }
  };

  const inp = "w-full rounded border border-border bg-card px-3 py-2 text-sm outline-none focus:border-imperium";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-2xl">{initial ? "Edit case study" : "New case study"}</h3>
        <div className="mt-5 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input className={inp} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
            <input className={inp} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input className={inp} placeholder="Client" value={client} onChange={(e) => setClient(e.target.value)} />
            <input className={inp} placeholder="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
          </div>
          <div>
            <label className="inline-flex cursor-pointer items-center gap-2 border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onCoverFile(f); }} />
              {uploading === "cover" ? "Uploading…" : "Upload cover"}
            </label>
            <span className="ml-3 text-[11px] text-muted-foreground">or paste cover URL below</span>
          </div>
          <input className={inp} placeholder="Cover image URL" value={cover} onChange={(e) => setCover(e.target.value)} />
          {cover && <img src={cover} alt="cover" className="max-h-48 rounded border border-border object-cover" />}
          <textarea className={inp} rows={3} placeholder="Challenge" value={challenge} onChange={(e) => setChallenge(e.target.value)} />
          <textarea className={inp} rows={3} placeholder="Solution" value={solution} onChange={(e) => setSolution(e.target.value)} />
          <textarea className={inp} rows={3} placeholder="Results" value={results} onChange={(e) => setResults(e.target.value)} />
          <div>
            <label className="inline-flex cursor-pointer items-center gap-2 border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onGalleryFile(f); }} />
              {uploading === "gallery" ? "Uploading…" : "Add gallery image"}
            </label>
            <span className="ml-3 text-[11px] text-muted-foreground">appends URL below</span>
          </div>
          <textarea className={inp} rows={4} placeholder="Gallery image URLs (one per line)" value={gallery} onChange={(e) => setGallery(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input className={inp} type="number" placeholder="Display order" value={order} onChange={(e) => setOrder(+e.target.value)} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> Featured</label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em]">Cancel</button>
          <button onClick={save} disabled={busy || uploading !== null} className="border border-imperium bg-imperium px-5 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-charleston disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

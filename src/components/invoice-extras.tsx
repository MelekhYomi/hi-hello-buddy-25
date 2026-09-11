import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Truck, Store } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/cart-context";
import { saveDeliveryDetails, setPaymentPlan } from "@/lib/billing.functions";

const PLANS = [
  { percent: 100, label: "Pay in full now", hint: "Settle everything today — fastest start" },
  { percent: 70, label: "70% now, 30% on delivery", hint: "Larger downpayment, smaller balance" },
  { percent: 50, label: "50% now, 50% on delivery", hint: "Our standard split" },
  { percent: 30, label: "30% now, 70% on delivery", hint: "Minimum to begin production" },
];

export function PaymentScheduleCard({
  token,
  total,
  depositPercent,
  dueDate,
}: {
  token: string;
  total: number;
  depositPercent: number;
  dueDate: string | null;
}) {
  const qc = useQueryClient();
  const choose = useServerFn(setPaymentPlan);
  const [busy, setBusy] = useState<number | null>(null);

  const apply = async (percent: number) => {
    setBusy(percent);
    try {
      await choose({ data: { token, deposit_percent: percent } });
      toast.success("Payment schedule updated");
      qc.invalidateQueries({ queryKey: ["invoice", token] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update the schedule");
    } finally {
      setBusy(null);
    }
  };

  const now = Math.round((total * depositPercent) / 100);
  const later = Math.max(0, total - now);

  return (
    <div className="mt-8 rounded-lg border border-border/60 bg-card/40 p-6">
      <CalendarClock className="h-6 w-6 text-imperium" strokeWidth={1.5} />
      <h2 className="mt-4 font-display text-xl">PAYMENT SCHEDULE</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Choose how you'd like to spread the payment. You can change this until your first payment.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PLANS.map((p) => (
          <button
            key={p.percent}
            type="button"
            onClick={() => apply(p.percent)}
            disabled={busy !== null}
            className={`rounded-md border p-4 text-left transition disabled:opacity-60 ${
              depositPercent === p.percent
                ? "border-imperium bg-imperium/10"
                : "border-border hover:border-imperium/60"
            }`}
          >
            <div className="text-sm font-semibold">{p.label}</div>
            <div className="mt-1 text-xs text-muted-foreground">{p.hint}</div>
            <div className="mt-2 font-mono text-[11px] text-imperium">
              {formatNaira(Math.round((total * p.percent) / 100))} now
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 divide-y divide-border/50 border-t border-border/50 text-sm">
        <div className="flex items-center justify-between py-3">
          <span>Instalment 1 — before production begins</span>
          <span className="font-display text-lg text-imperium">{formatNaira(now)}</span>
        </div>
        {later > 0 && (
          <div className="flex items-center justify-between py-3">
            <span>Instalment 2 — on delivery{dueDate ? ` (by ${dueDate})` : ""}</span>
            <span className="font-display text-lg">{formatNaira(later)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function DeliveryCard({
  token,
  currentChoice,
  currentAddress,
  phone,
}: {
  token: string;
  currentChoice: string | null;
  currentAddress: string | null;
  phone: string | null;
}) {
  const qc = useQueryClient();
  const save = useServerFn(saveDeliveryDetails);
  const [choice, setChoice] = useState<"delivery" | "pickup">(
    currentChoice === "pickup" ? "pickup" : "delivery",
  );
  const [address, setAddress] = useState(currentChoice ? "" : "");
  const [zone, setZone] = useState("");
  const [contact, setContact] = useState(phone ?? "");
  const [busy, setBusy] = useState(false);

  const zones = useQuery({
    queryKey: ["delivery-zones"],
    queryFn: async () => {
      const { data } = await supabase
        .from("delivery_zones")
        .select("id,name,fee,eta_days,free_above_amount")
        .eq("is_active", true)
        .order("display_order");
      return data ?? [];
    },
  });

  const submit = async () => {
    setBusy(true);
    try {
      await save({ data: { token, choice, address, zone, contact_phone: contact } });
      toast.success(
        choice === "pickup"
          ? "Noted — you'll pick up from the studio."
          : "Delivery details saved. We'll deliver to that address.",
      );
      qc.invalidateQueries({ queryKey: ["invoice", token] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save that");
    } finally {
      setBusy(false);
    }
  };

  const selectedZone = zones.data?.find((z: any) => z.name === zone);

  return (
    <div className="mt-8 rounded-lg border border-border/60 bg-card/40 p-6">
      <Truck className="h-6 w-6 text-imperium" strokeWidth={1.5} />
      <h2 className="mt-4 font-display text-xl">DELIVERY DETAILS</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Tell us how you'd like to receive the finished job. Our delivery team handles doorstep drop-offs.
      </p>

      {currentAddress && (
        <p className="mt-4 rounded-md border border-imperium/40 bg-imperium/5 p-3 text-xs">
          Saved: {currentAddress}
        </p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(
          [
            { key: "delivery" as const, label: "Deliver to me", icon: Truck, hint: "Home or office address" },
            { key: "pickup" as const, label: "I'll pick up", icon: Store, hint: "Collect from the Jos studio" },
          ]
        ).map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => setChoice(o.key)}
            className={`flex items-start gap-3 rounded-md border p-4 text-left transition ${
              choice === o.key ? "border-imperium bg-imperium/10" : "border-border hover:border-imperium/60"
            }`}
          >
            <o.icon className="mt-0.5 h-4 w-4 text-imperium" />
            <span>
              <span className="block text-sm font-semibold">{o.label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{o.hint}</span>
            </span>
          </button>
        ))}
      </div>

      {choice === "delivery" && (
        <div className="mt-5 space-y-3">
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            placeholder="Delivery address — street, area, city, state"
            className="w-full rounded-md border border-border bg-input px-4 py-3 text-sm outline-none focus:border-imperium"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="rounded-md border border-border bg-input px-4 py-3 text-sm outline-none focus:border-imperium"
            >
              <option value="">Delivery area (optional)</option>
              {zones.data?.map((z: any) => (
                <option key={z.id} value={z.name}>
                  {z.name} — {z.fee === 0 ? "free" : formatNaira(z.fee)}
                  {z.eta_days ? ` · ${z.eta_days}` : ""}
                </option>
              ))}
            </select>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Phone for the delivery rider"
              className="rounded-md border border-border bg-input px-4 py-3 text-sm outline-none focus:border-imperium"
            />
          </div>
          {selectedZone && (
            <p className="text-xs text-muted-foreground">
              {selectedZone.name}: delivery fee {selectedZone.fee === 0 ? "free" : formatNaira(selectedZone.fee)}
              {selectedZone.free_above_amount
                ? ` — free on jobs above ${formatNaira(selectedZone.free_above_amount)}`
                : ""}
              {selectedZone.eta_days ? ` · usually ${selectedZone.eta_days}` : ""}. Confirmed with you before dispatch.
            </p>
          )}
        </div>
      )}

      <button onClick={submit} disabled={busy} className="btn-cta mt-5 h-11 px-5 disabled:opacity-50">
        {busy ? "Saving…" : "Save delivery details"}
      </button>
    </div>
  );
}

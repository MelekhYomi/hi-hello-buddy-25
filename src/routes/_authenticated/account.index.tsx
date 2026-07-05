import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { sendPhoneOtp, verifyPhoneOtp, termiiStatus } from "@/lib/termii.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account/")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const send = useServerFn(sendPhoneOtp);
  const verify = useServerFn(verifyPhoneOtp);
  const status = useServerFn(termiiStatus);

  const profile = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, phone, address, phone_verified")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const otpAvailable = useQuery({ queryKey: ["termii-status"], queryFn: () => status(), staleTime: 60_000 });

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [pinId, setPinId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile.data) {
      setDisplayName(profile.data.display_name ?? "");
      setPhone(profile.data.phone ?? "");
      setAddress(profile.data.address ?? "");
    }
  }, [profile.data]);

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, phone, address })
      .eq("id", user.id);
    setSavingProfile(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    }
  };

  const requestOtp = async () => {
    if (!phone) return toast.error("Enter a phone number first");
    setBusy(true);
    try {
      const r = await send({ data: { phone } });
      if (!r.ok) toast.error(r.reason === "termii_disabled" ? "Phone verification is not enabled" : r.reason);
      else {
        setPinId(r.pinId);
        toast.success("Code sent");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const confirmOtp = async () => {
    if (!pinId) return;
    setBusy(true);
    try {
      const r = await verify({ data: { pinId, pin, phone } });
      if (!r.ok) toast.error(r.reason === "termii_disabled" ? "Phone verification not enabled" : "Invalid code");
      else {
        toast.success("Phone verified");
        setPinId(null);
        setPin("");
        qc.invalidateQueries({ queryKey: ["my-profile"] });
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const inp = "mt-2 w-full border-b border-border bg-transparent py-3 text-base outline-none transition-colors focus:border-imperium";
  const lbl = "font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground";

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <div className={lbl}>Email</div>
        <div className="mt-2 py-3 text-base text-muted-foreground">{user?.email}</div>
      </div>

      <label className="block">
        <span className={lbl}>Full name</span>
        <input className={inp} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </label>

      <label className="block">
        <span className={lbl}>
          Phone {profile.data?.phone_verified && <span className="ml-2 text-imperium">verified ✓</span>}
        </span>
        <input className={inp} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234…" />
      </label>

      <label className="block">
        <span className={lbl}>Delivery address</span>
        <textarea rows={3} className={`${inp} resize-none`} value={address} onChange={(e) => setAddress(e.target.value)} />
      </label>

      <button
        onClick={saveProfile}
        disabled={savingProfile}
        className="bg-imperium px-8 py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {savingProfile ? "Saving…" : "Save profile"}
      </button>

      {otpAvailable.data?.enabled && !profile.data?.phone_verified && phone && (
        <div className="mt-8 border border-border/60 bg-card p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-imperium">Verify phone</div>
          <p className="mt-2 text-sm text-muted-foreground">
            We'll send a 6-digit code via {otpAvailable.data.channel === "whatsapp" ? "WhatsApp" : "SMS"}.
          </p>
          {!pinId ? (
            <button
              onClick={requestOtp}
              disabled={busy}
              className="mt-4 border border-imperium bg-imperium/10 px-6 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-imperium hover:bg-imperium hover:text-charleston disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send code"}
            </button>
          ) : (
            <div className="mt-4 flex gap-2">
              <input
                className="w-40 border border-border bg-background px-3 py-2 font-mono text-base tracking-widest outline-none focus:border-imperium"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="123456"
              />
              <button
                onClick={confirmOtp}
                disabled={busy || pin.length < 4}
                className="border border-imperium bg-imperium/10 px-6 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-imperium hover:bg-imperium hover:text-charleston disabled:opacity-50"
              >
                {busy ? "Verifying…" : "Verify"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

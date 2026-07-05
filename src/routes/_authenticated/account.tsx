import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My Account — C Imperium" }, { name: "robots", content: "noindex" }] }),
  component: AccountLayout,
});

function AccountLayout() {
  const { pathname } = useLocation();
  const tab = (to: string, label: string) => (
    <Link
      to={to}
      className={cn(
        "border-b-2 pb-3 font-mono text-[11px] uppercase tracking-[0.25em] transition-colors",
        pathname === to || (to === "/account" && pathname === "/account")
          ? "border-imperium text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );

  return (
    <div className="grain relative min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 pb-24 pt-32">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-imperium">Client portal</div>
        <h1 className="mt-3 font-display text-5xl md:text-6xl">MY ACCOUNT.</h1>

        <div className="mt-10 flex flex-wrap gap-8 border-b border-border/60">
          {tab("/account", "Profile")}
          {tab("/account/orders", "Orders")}
          {tab("/account/bookings", "Bookings")}
        </div>

        <div className="mt-10">
          <Outlet />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

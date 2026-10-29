import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { QuoteProvider } from "@/lib/quote-context";
import { CartDrawer } from "@/components/cart-drawer";
import { QuoteDrawer } from "@/components/quote-drawer";
import { SignInNudge } from "@/components/sign-in-nudge";
import { LeadCapturePopup } from "@/components/lead-capture-popup";
import { useVisitorTracker } from "@/lib/use-visitor-tracker";
import { siteSettingsQuery, servicesQuery, prefetch } from "@/lib/queries";
import { DEFAULT_OG_IMAGE, businessJsonLd } from "@/lib/seo";

import appCss from "../styles.css?url";
import poppins400 from "@fontsource/poppins/files/poppins-latin-400-normal.woff2?url";
import poppins800 from "@fontsource/poppins/files/poppins-latin-800-normal.woff2?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // Site settings feed the header, footer and most sections; load them with the HTML.
  loader: async ({ context }) => {
    await Promise.all([
      prefetch(context.queryClient, siteSettingsQuery),
      // Also feeds the footer's service links, so every page links to the service pages.
      prefetch(context.queryClient, servicesQuery),
    ]);
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#222931" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "C Imperium" },
      { title: "C Imperium Branding" },
      { name: "description", content: "Premium branding agency from Jos, Nigeria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "C Imperium Branding" },
      { name: "twitter:title", content: "C Imperium Branding" },
      { property: "og:description", content: "Premium branding agency from Jos, Nigeria." },
      { name: "twitter:description", content: "Premium branding agency from Jos, Nigeria." },
      { property: "og:image", content: DEFAULT_OG_IMAGE },
      { name: "twitter:image", content: DEFAULT_OG_IMAGE },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
      // Preload the two weights used above the fold (body text and display headings).
      { rel: "preload", as: "font", type: "font/woff2", href: poppins400, crossOrigin: "anonymous" },
      { rel: "preload", as: "font", type: "font/woff2", href: poppins800, crossOrigin: "anonymous" },
    ],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(businessJsonLd) }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Supabase recovery links land on the Site URL (root) with a hash
  // (#access_token=...&type=recovery or #error=...). Forward to /reset-password
  // so the user can complete or retry the flow.
  if (typeof window !== "undefined") {
    const h = window.location.hash;
    if (
      window.location.pathname === "/" &&
      (h.includes("type=recovery") || h.includes("error_code=otp_expired"))
    ) {
      window.location.replace("/reset-password" + h);
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <QuoteProvider>
            <TrackerHost />
            <Outlet />
            <CartDrawer />
            <QuoteDrawer />
            <SignInNudge />
            <LeadCapturePopup />
            <Toaster />
          </QuoteProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function TrackerHost() {
  useVisitorTracker();
  return null;
}

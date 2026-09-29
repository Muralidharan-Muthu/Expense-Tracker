import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter, useRouterState, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { LiWiseLogo } from "@/components/LiWiseLogo";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useTheme } from "@/hooks/useTheme";

function NotFoundComponent() {
  return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="max-w-md text-center"><h1 className="text-7xl font-bold">404</h1><h2 className="mt-4 text-xl font-semibold">Page not found</h2><p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p><Button asChild className="mt-6"><Link to="/">Go to overview</Link></Button></div></div>;
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="max-w-md text-center"><h1 className="text-xl font-semibold">This page didn't load</h1><p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try again or return to the overview.</p><div className="mt-6 flex justify-center gap-2"><Button onClick={() => { router.invalidate(); reset(); }}>Try again</Button><Button asChild variant="outline"><Link to="/">Go home</Link></Button></div></div></div>;
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1" }, { title: "LiWise" },
      { name: "description", content: "LiWise keeps daily spending, monthly balances and budgets clear in one private workspace." },
      { property: "og:title", content: "LiWise" }, { property: "og:description", content: "Track spending, balances and budgets with LiWise." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0e6b74" }, { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" }, { name: "apple-mobile-web-app-title", content: "LiWise" },
    ],
    links: [{ rel: "stylesheet", href: appCss }, { rel: "icon", href: "/favicon.png", type: "image/png" }, { rel: "manifest", href: "/manifest.webmanifest" }, { rel: "apple-touch-icon", href: "/icons/icon-192.png" }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return <html lang="en"><head><HeadContent /></head><body>{children}<Scripts /></body></html>;
}

function PublicHeader() {
  const { theme, toggle } = useTheme();
  return <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur"><div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3"><Link to="/"><LiWiseLogo /></Link><nav className="flex items-center gap-1"><Button variant="ghost" size="icon" aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} onClick={toggle}>{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button><Button asChild size="sm"><Link to="/auth">Sign in</Link></Button></nav></div></header>;
}

function AppFrame({ queryClient }: { queryClient: QueryClient }) {
  const { session, loading } = useSession();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const publicPage = pathname === "/auth" || pathname === "/onboarding";
  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading LiWise…</div>;
  if (!session || publicPage) return <div className="min-h-screen bg-background"><PublicHeader /><Outlet /></div>;
  return (
    <SidebarProvider>
      <AppSidebar queryClient={queryClient} />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-3 backdrop-blur sm:px-4">
          <SidebarTrigger className="size-9" />
          <span className="text-sm font-semibold text-muted-foreground">LiWise workspace</span>
        </header>
        <div className="min-w-0 flex-1"><Outlet /></div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);
  return <QueryClientProvider client={queryClient}><AppFrame queryClient={queryClient} /><Toaster richColors position="top-center" /></QueryClientProvider>;
}

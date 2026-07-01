import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./lib/auth";
import { NavProvider, useNav } from "./lib/nav";
import { ToastProvider } from "./components/ui";
import { fetchSettings } from "./lib/data";
import { cn } from "./components/ui";
import {
  HomeIcon,
  SparkIcon,
  BagIcon,
  ReceiptIcon,
  BotIcon,
} from "./lib/icons";

import Auth from "./screens/Auth";
import Home from "./screens/Home";
import Services from "./screens/Services";
import Store from "./screens/Store";
import Orders from "./screens/Orders";
import OrderDetail from "./screens/OrderDetail";
import AIChat from "./screens/AIChat";
import Settings from "./screens/Settings";
import Admin from "./screens/Admin";

function hideBoot() {
  const b = document.getElementById("boot");
  if (b) { b.style.opacity = "0"; setTimeout(() => b.remove(), 400); }
}

function Shell() {
  const { session, profile, loading } = useAuth();
  const { route, replace } = useNav();
  const [maint, setMaint] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => { hideBoot(); }, []);

  // Track that initial load is complete
  useEffect(() => {
    if (!loading) setReady(true);
  }, [loading]);

  // PWA install
  useEffect(() => {
    const onBIP = (e: any) => { e.preventDefault(); (window as any).__adfInstallPrompt = e; };
    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  // Service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Maintenance check
  useEffect(() => {
    if (session && profile?.role !== "admin") {
      fetchSettings().then((s) => setMaint(!!s?.maintenance)).catch(() => {});
    } else setMaint(false);
  }, [session, profile?.role]);

  // ——— After login: force-land on home if user came from auth ———
  useEffect(() => {
    if (session && profile && ready && route.name !== "admin") {
      // If we just authenticated, always land on home (except admin deeplink)
      if (route.name === "home") return; // already home
      // For deep-links like /settings /orders etc, keep them
      const keepRoutes = ["settings", "services", "store", "orders", "ai", "order-detail", "admin"];
      if (!keepRoutes.includes(route.name)) {
        replace({ name: "home" });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, profile?.id, ready]);

  if (!ready) {
    return (
      <div className="flex h-dvh items-center justify-center bg-surface">
        <div className="h-10 w-10 rounded-full border-4 border-accent-200 border-t-accent-500 animate-spin" />
      </div>
    );
  }

  if (!session) return <Auth />;

  if (profile?.banned) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-surface px-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50">
          <div className="h-8 w-8 rounded-full border-2 border-rose-300" />
        </div>
        <p className="text-lg font-bold text-base">Compte suspendu</p>
        <p className="mt-1 text-sm text-muted">Contactez l'administrateur.</p>
      </div>
    );
  }

  if (maint) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-surface px-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-accent-50">
          <div className="h-8 w-8 rounded-full border-2 border-accent-300" />
        </div>
        <p className="text-lg font-bold text-base">Maintenance</p>
        <p className="mt-1 text-sm text-muted">ADF revient très bientôt.</p>
      </div>
    );
  }

  const noNav = ["ai", "order-detail"].includes(route.name);
  const mainTabs = ["home", "services", "store", "orders"];

  let screen: React.ReactNode;
  switch (route.name) {
    case "services": screen = <Services />; break;
    case "store": screen = <Store />; break;
    case "orders": screen = <Orders />; break;
    case "order-detail": screen = <OrderDetail />; break;
    case "ai": screen = <AIChat />; break;
    case "settings": screen = <Settings />; break;
    case "admin":
      screen = profile?.role === "admin" ? <Admin /> : <Home />;
      break;
    default: screen = <Home />;
  }

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-surface overflow-hidden">
      <main
        id="adf-scroll"
        className={cn("relative flex-1 overflow-y-auto min-h-0", noNav && "overflow-hidden")}
      >
        {screen}
      </main>
      {!noNav && mainTabs.includes(route.name) && <BottomNav active={route.name} />}
    </div>
  );
}

function BottomNav({ active }: { active: string }) {
  const { go } = useNav();
  const items: {
    k: string; label: string; icon: React.ComponentType<{ className?: string }>; center?: boolean;
  }[] = [
    { k: "home", label: "Accueil", icon: HomeIcon },
    { k: "services", label: "Services", icon: SparkIcon },
    { k: "ai", label: "ADF IA", icon: BotIcon, center: true },
    { k: "store", label: "Boutique", icon: BagIcon },
    { k: "orders", label: "Commandes", icon: ReceiptIcon },
  ];

  return (
    <nav className="card-glass-strong safe-bottom z-40 flex items-stretch justify-around border-t border-slate-200/60 px-1 pb-1 pt-1.5">
      {items.map((it) => {
        const Icon = it.icon;
        const isActive = active === it.k;
        if (it.center) {
          return (
            <button key={it.k} onClick={() => go({ name: it.k })} className="flex flex-1 flex-col items-center">
              <span className={cn("-mt-6 flex h-14 w-14 items-center justify-center rounded-full gradient-brand text-white shadow-lg shadow-accent-500/25 transition active:scale-90", isActive && "ring-2 ring-accent-300 ring-offset-2")}>
                <Icon className="h-7 w-7" />
              </span>
              <span className={cn("mt-0.5 text-[10px] font-semibold", isActive ? "text-accent-600" : "text-muted")}>{it.label}</span>
            </button>
          );
        }
        return (
          <button key={it.k} onClick={() => go({ name: it.k })} className="flex flex-1 flex-col items-center gap-1 py-1.5">
            <Icon className={cn("h-5 w-5 transition", isActive ? "text-accent-500" : "text-muted/60")} />
            <span className={cn("text-[10px] font-semibold", isActive ? "text-accent-600" : "text-muted")}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <NavProvider>
          <Shell />
        </NavProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

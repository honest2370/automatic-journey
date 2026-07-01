import { useAuth } from "../lib/auth";
import { useNav } from "../lib/nav";
import { useAsync, fetchServices, fetchProducts, fetchSettings } from "../lib/data";
import { supabase } from "../lib/supabase";
import { Button, fmtCFA, useToast, Card } from "../components/ui";
import { LogoMark } from "../components/Logo";
import {
  ServiceIcon, BagIcon, ReceiptIcon, BotIcon, BellIcon,
  SparkIcon, ChevronRightIcon, ShieldIcon, TrendingIcon, CoinsIcon,
  GraduationIcon, RocketIcon, HandshakeIcon, TargetIcon, BulbIcon, GearIcon,
} from "../lib/icons";
import type { Service, Product } from "../lib/types";

const POLES = [
  {
    n: "01", color: "from-sky-500 to-cyan-400",
    title: "Produits numériques premium",
    icon: SparkIcon,
    items: ["Logos signature", "Cartes de visite interactives", "Billets de mariage innovants", "Supports publicitaires"],
    tag: "Design · Créativité · Impact",
    route: "services",
  },
  {
    n: "02", color: "from-violet-500 to-blue-500",
    title: "Automatisation & IA",
    icon: BotIcon,
    items: ["Agents IA WhatsApp 24/7", "Service client autonome", "Vente & collecte de commandes"],
    tag: "Automatiser · Gagner · Évoluer",
    route: "ai",
  },
  {
    n: "03", color: "from-emerald-500 to-teal-400",
    title: "Formations professionnelles",
    icon: GraduationIcon,
    items: ["Design numérique", "Cartes bancaires virtuelles", "Montage vidéo avec voix IA"],
    tag: "Apprendre · Maîtriser · Réussir",
    route: "services",
  },
  {
    n: "04", color: "from-amber-500 to-orange-400",
    title: "Boutique numérique",
    icon: BagIcon,
    items: ["Ebooks", "Ressources & guides numériques", "Outils pour votre succès"],
    tag: "Lire · Apprendre · Progresser",
    route: "store",
  },
] as const;

const VALUES = [
  { icon: BulbIcon, label: "Créativité sans limites" },
  { icon: GearIcon, label: "Solutions sur-mesure" },
  { icon: RocketIcon, label: "Innovation continue" },
  { icon: HandshakeIcon, label: "Accompagnement personnalisé" },
  { icon: TargetIcon, label: "Résultats garantis" },
] as const;

export default function Home() {
  const { profile } = useAuth();
  const { go } = useNav();
  const toast = useToast();
  const services = useAsync<Service[]>(fetchServices, []);
  const products = useAsync<Product[]>(fetchProducts, []);
  const settings = useAsync(fetchSettings, []);

  const counts = useAsync(async () => {
    const uid = profile?.id;
    if (!uid) return { svc: 0, prd: 0 };
    const [s, p] = await Promise.all([
      supabase.from("service_orders").select("id", { count: "exact", head: true }).eq("user_id", uid),
      supabase.from("product_orders").select("id", { count: "exact", head: true }).eq("user_id", uid),
    ]);
    return { svc: s.count || 0, prd: p.count || 0 };
  }, [profile?.id]);

  const isAdmin = profile?.role === "admin";

  return (
    <div className="min-h-[100dvh] bg-surface pb-28">
      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden">
        {/* gradient bg matching ADF brand deep-navy → cyan */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#060c20] via-[#0a3d6e] to-[#0ea5e9]" />
        {/* decorative glow blobs */}
        <div className="absolute -top-10 -right-10 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute top-24 -left-8 h-40 w-40 rounded-full bg-sky-500/20 blur-2xl" />

        <div className="relative px-4 pt-14 pb-8 safe-top">
          {/* top bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <LogoMark size={36} />
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300/80">Arafat Digital Futurist</div>
                <div className="text-[10px] text-white/50 leading-tight">L'Intelligence Naturelle du PDG</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toast({ type: "info", msg: "Aucune nouvelle notification." })}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/10"
              >
                <BellIcon className="h-4.5 w-4.5 text-white/80" />
              </button>
              <button
                onClick={() => go({ name: "settings" })}
                className="h-9 rounded-xl bg-white/10 border border-white/10 px-3 text-[12px] font-semibold text-white"
              >
                Profil
              </button>
            </div>
          </div>

          {/* greeting */}
          <div className="mb-5">
            <p className="text-[13px] text-white/60 font-medium">Bonjour 👋</p>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {profile?.full_name?.split(" ")[0] || "Bienvenue"}
              {isAdmin && (
                <span className="ml-2 rounded-full bg-cyan-400/20 border border-cyan-400/30 px-2 py-0.5 text-[10px] font-bold text-cyan-300 align-middle">
                  Admin
                </span>
              )}
            </h1>
            <p className="mt-0.5 text-[13px] text-white/50">Au service de votre succès numérique.</p>
          </div>

          {/* stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 border border-white/10 p-3.5">
              <div className="flex items-center justify-between mb-1">
                <ReceiptIcon className="h-4 w-4 text-cyan-300" />
                <TrendingIcon className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <p className="text-xl font-extrabold text-white">{counts.data?.svc ?? "–"}</p>
              <p className="text-[10px] text-white/50 font-medium">Commandes services</p>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/10 p-3.5">
              <div className="flex items-center justify-between mb-1">
                <BagIcon className="h-4 w-4 text-cyan-300" />
                <CoinsIcon className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <p className="text-xl font-extrabold text-white">{counts.data?.prd ?? "–"}</p>
              <p className="text-[10px] text-white/50 font-medium">Achats boutique</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6 pt-5">
        {/* Announcement */}
        {settings.data?.store_announcement && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-accent-50 border border-accent-100 px-4 py-3 animate-fade">
            <SparkIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
            <p className="text-[13px] leading-snug text-accent-700">{settings.data.store_announcement}</p>
          </div>
        )}

        {/* ADF IA hero card */}
        <button
          onClick={() => go({ name: "ai" })}
          className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#060c20] to-[#0a3d6e] border border-white/5 text-left active:scale-[.98] transition"
        >
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-cyan-400 blur-3xl" />
          </div>
          <div className="relative flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl gradient-brand shadow-lg shadow-cyan-500/30">
              <LogoMark size={32} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-cyan-400/80 mb-0.5">Pôle 02</p>
              <h3 className="font-extrabold text-white text-[15px]">ADF IA — Agent Intelligent</h3>
              <p className="mt-0.5 text-[12px] text-white/50">Disponible 24h/24 · Réponses instantanées</p>
            </div>
            <ChevronRightIcon className="h-5 w-5 shrink-0 text-white/30" />
          </div>
        </button>

        {/* Quick nav */}
        <div className="grid grid-cols-4 gap-2">
          {([
            { icon: <SparkIcon className="h-5 w-5" />, label: "Services", to: "services" },
            { icon: <BagIcon className="h-5 w-5" />, label: "Boutique", to: "store" },
            { icon: <ReceiptIcon className="h-5 w-5" />, label: "Commandes", to: "orders" },
            { icon: <BotIcon className="h-5 w-5" />, label: "ADF IA", to: "ai" },
          ] as const).map((a) => (
            <button
              key={a.label}
              onClick={() => go({ name: a.to })}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-white border border-slate-100 p-3 text-center transition hover:border-accent-200 hover:bg-accent-50/30 active:scale-95"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-500">
                {a.icon}
              </span>
              <span className="text-[10px] font-semibold leading-tight text-base-soft">{a.label}</span>
            </button>
          ))}
        </div>

        {isAdmin && (
          <Button full variant="secondary" onClick={() => go({ name: "admin" })}>
            <ShieldIcon className="h-4 w-4" /> Panneau d'administration
          </Button>
        )}

        {/* ── NOS 4 PÔLES D'EXPERTISE ── */}
        <section>
          <div className="mb-1 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent-500">Notre offre complète</p>
            <h2 className="text-[17px] font-extrabold text-base mt-0.5">Nos 4 Pôles d'Expertise</h2>
          </div>
          <div className="mt-4 space-y-3">
            {POLES.map((pole) => {
              const Icon = pole.icon;
              return (
                <button
                  key={pole.n}
                  onClick={() => go({ name: pole.route as any })}
                  className="w-full rounded-3xl bg-white border border-slate-100 overflow-hidden text-left transition hover:border-accent-200 active:scale-[.99]"
                >
                  <div className={`flex items-center gap-3 bg-gradient-to-r ${pole.color} px-4 py-3`}>
                    <span className="text-[11px] font-black text-white/60 font-mono">{pole.n}</span>
                    <Icon className="h-5 w-5 text-white" />
                    <span className="flex-1 font-extrabold text-white text-[13px] leading-snug">{pole.title}</span>
                    <ChevronRightIcon className="h-4 w-4 text-white/50 shrink-0" />
                  </div>
                  <div className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {pole.items.map((item) => (
                        <span key={item} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-base-soft">
                          {item}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-accent-500/70">{pole.tag}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Services carousel */}
        {(services.data || []).length > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-extrabold text-base">Nos services</h2>
              <button onClick={() => go({ name: "services" })} className="flex items-center text-xs font-semibold text-accent-600">
                Tout voir <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
              {(services.data || []).slice(0, 6).map((s) => (
                <button
                  key={s.id}
                  onClick={() => go({ name: "services", params: { select: s.id } })}
                  className="w-36 shrink-0 rounded-2xl bg-white border border-slate-100 p-3 text-left shadow-sm hover:border-accent-200 transition active:scale-95"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand text-white">
                    <ServiceIcon name={s.icon} className="h-5 w-5" />
                  </span>
                  <p className="mt-2 text-[13px] font-semibold leading-tight text-base-soft">{s.name}</p>
                  <p className="mt-1 text-[11px] text-accent-600 font-semibold">dès {fmtCFA(s.base_price)}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Products carousel */}
        {(products.data || []).length > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-extrabold text-base">Boutique</h2>
              <button onClick={() => go({ name: "store" })} className="flex items-center text-xs font-semibold text-accent-600">
                Tout voir <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
              {(products.data || []).slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  onClick={() => go({ name: "store", params: { select: p.id } })}
                  className="w-40 shrink-0 overflow-hidden rounded-2xl bg-white border border-slate-100 text-left shadow-sm hover:border-accent-200 transition active:scale-95"
                >
                  <div className="aspect-square w-full bg-slate-100">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted/40">
                        <BagIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-[13px] font-semibold text-base-soft">{p.name}</p>
                    <p className="mt-0.5 text-[11px] font-bold text-accent-600">{fmtCFA(p.price)}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── VALUES STRIP ── */}
        <section className="rounded-3xl bg-gradient-to-br from-[#060c20] to-[#0a3d6e] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/70 mb-1">Notre ADN</p>
          <h2 className="text-[15px] font-extrabold text-white mb-4">Pourquoi choisir ADF ?</h2>
          <div className="space-y-3">
            {VALUES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/10">
                  <Icon className="h-4.5 w-4.5 text-cyan-300" />
                </span>
                <span className="text-[13px] font-semibold text-white/80">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Founder card */}
        <section className="rounded-3xl bg-white border border-slate-100 p-5 flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 rounded-2xl gradient-brand flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-accent-500/20">
            AG
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-accent-500/70">Fondateur & CEO</p>
            <p className="text-[16px] font-extrabold text-base mt-0.5">Arafat Garga</p>
            <p className="text-[12px] text-muted leading-snug mt-0.5">
              L'intelligence naturelle du PDG au service de votre succès numérique.
            </p>
          </div>
        </section>

        <footer className="pt-2 pb-2 text-center">
          <p className="text-[11px] text-muted/50">© {new Date().getFullYear()} ADF — Arafat Digital Futurist</p>
          <p className="text-[11px] text-muted/40">Conçue par le PDG, M. Arafat Garga</p>
        </footer>
      </div>
    </div>
  );
}

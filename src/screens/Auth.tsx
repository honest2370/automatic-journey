import { useState } from "react";
import { useAuth } from "../lib/auth";
import { Button, Input, Field, useToast } from "../components/ui";
import {
  MailIcon, LockIcon, UserIcon, PhoneIcon, EyeIcon, EyeOffIcon,
} from "../lib/icons";
import { LogoLockup } from "../components/Logo";

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    if (mode === "login") {
      const { error } = await signIn(email.trim(), password);
      if (error) setErr(error);
      else toast({ type: "success", msg: "Connexion réussie !" });
    } else {
      if (!name.trim()) { setErr("Veuillez entrer votre nom complet."); setLoading(false); return; }
      const { error, needsConfirm } = await signUp(email.trim(), password, name.trim(), phone.trim());
      if (needsConfirm) setErr("Compte créé. Veuillez confirmer votre e-mail.");
      else if (error) setErr(error);
      else toast({ type: "success", msg: "Compte créé. Bienvenue chez ADF !" });
    }
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden">
      {/* ── BRAND HERO HEADER ── */}
      <div className="relative bg-gradient-to-br from-[#060c20] via-[#0a3d6e] to-[#0ea5e9] px-6 pt-16 pb-12 safe-top">
        {/* glow blobs */}
        <div className="absolute -top-16 -right-12 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
        <div className="absolute top-20 -left-10 h-40 w-40 rounded-full bg-sky-500/15 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col items-center text-center animate-slide-up">
          {/* real ADF logo lockup */}
          <LogoLockup size={100} className="mb-4 drop-shadow-2xl" />

          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300/70 mt-1">
            L'Intelligence Naturelle du PDG
          </p>
          <p className="mt-3 max-w-xs text-[13px] text-white/55 leading-relaxed">
            Services créatifs, boutique digitale et assistant IA — tout dans une seule application.
          </p>

          {/* value pills */}
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {["Design", "Automatisation", "Formations", "Boutique"].map((t) => (
              <span key={t} className="rounded-full bg-white/10 border border-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-white/70">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── FORM CARD ── */}
      <div className="flex-1 bg-surface px-5 pt-6 pb-8">
        <div className="card-glass rounded-3xl p-5 animate-slide-up">
          {/* tab switcher */}
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setErr(""); }}
                className={`h-10 rounded-xl text-sm font-semibold transition-all ${
                  mode === m ? "bg-white text-base shadow-sm" : "text-muted"
                }`}
              >
                {m === "login" ? "Connexion" : "Inscription"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            {mode === "register" && (
              <>
                <Field label="Nom complet">
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
                    <Input className="pl-10" placeholder="Ex. Arafat Garga" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                </Field>
                <Field label="Téléphone">
                  <div className="relative">
                    <PhoneIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
                    <Input className="pl-10" placeholder="+229 …" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </Field>
              </>
            )}

            <Field label="Adresse e-mail">
              <div className="relative">
                <MailIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
                <Input type="email" required className="pl-10" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </Field>

            <Field label="Mot de passe">
              <div className="relative">
                <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
                <Input
                  type={show ? "text" : "password"} required minLength={6}
                  className="pl-10 pr-10" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted/60">
                  {show ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            {err && (
              <p className="rounded-2xl bg-rose-50 px-3.5 py-2.5 text-xs text-rose-600 border border-rose-200">
                {err}
              </p>
            )}

            <Button type="submit" full size="lg" loading={loading}>
              {mode === "login" ? "Se connecter" : "Créer mon compte"}
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[11px] text-muted/50">Conçue par le PDG d'ADF — M. Arafat Garga</p>
          <p className="text-[10px] text-muted/35 mt-0.5">Au service de votre succès numérique.</p>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { useNav } from "../lib/nav";
import { uploadFile } from "../lib/supabase";
import { Button, Input, Field, Avatar, useToast, fmtDate } from "../components/ui";
import { Header } from "./Services";
import {
  UserIcon, PhoneIcon, MailIcon, LogoutIcon,
  BotIcon, DownloadIcon, ShieldIcon, SparkIcon, CheckCircleIcon,
} from "../lib/icons";
import { LogoMark } from "../components/Logo";

export default function Settings() {
  const { profile, signOut, updateMyProfile } = useAuth();
  const { back, go } = useNav();
  const toast = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Sync form whenever profile loads or changes
  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name || "");
    setPhone(profile.phone || "");
    setAvatar(profile.avatar_url || null);
  }, [profile?.id, profile?.full_name, profile?.phone, profile?.avatar_url]);

  const save = async () => {
    if (!name.trim()) {
      toast({ type: "error", msg: "Le nom complet est requis." });
      return;
    }
    setSaving(true);
    try {
      await updateMyProfile({ full_name: name.trim(), phone: phone.trim(), avatar_url: avatar });
      toast({ type: "success", msg: "Profil mis à jour." });
    } catch {
      toast({ type: "error", msg: "Erreur lors de la mise à jour du profil." });
    } finally {
      setSaving(false);
    }
  };

  const pickAvatar = async (f: File) => {
    if (!profile) return;
    const up = await uploadFile(profile.id, f, "avatars");
    if (up) {
      setAvatar(up.url);
      toast({ type: "success", msg: "Photo chargée. Enregistrez les modifications." });
    } else {
      toast({ type: "error", msg: "Échec de l'envoi de la photo." });
    }
  };

  const install = async () => {
    const prompt = (window as any).__adfInstallPrompt;
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") toast({ type: "success", msg: "Installation lancée." });
    } else {
      toast({ type: "info", msg: "Menu → « Ajouter à l'écran d'accueil »." });
    }
  };

  const limit = profile?.ai_message_limit || 50;
  const used = profile?.ai_message_count || 0;
  const pct = limit ? Math.min(100, (used / limit) * 100) : 0;

  return (
    <div className="min-h-full bg-surface">
      <Header back={back} title="Profil & réglages" />
      <div className="px-4 pb-28 pt-2 space-y-4">

        {/* ── PROFILE CARD ── */}
        <div className="card-glass rounded-3xl p-5">
          <div className="flex items-center gap-4">
            <label className="relative cursor-pointer shrink-0">
              <Avatar name={profile?.full_name || "?"} url={avatar} size={72} />
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full gradient-brand text-white shadow">
                <DownloadIcon className="h-3.5 w-3.5 rotate-180" />
              </span>
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && pickAvatar(e.target.files[0])} />
            </label>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-extrabold text-base">
                {profile?.full_name || "Utilisateur ADF"}
              </p>
              <p className="truncate text-sm text-muted">{profile?.email || "—"}</p>
              <p className="text-xs text-muted">{profile?.phone || "Aucun téléphone"}</p>
              {profile?.role === "admin" && (
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-accent-100 border border-accent-200 px-2.5 py-0.5 text-[10px] font-bold text-accent-700">
                  <ShieldIcon className="h-3 w-3" /> Administrateur
                </span>
              )}
            </div>
          </div>

          {/* mini stats row */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-[10px] text-muted font-medium">Rôle</p>
              <p className="text-[13px] font-bold text-base-soft capitalize">{profile?.role || "user"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-[10px] text-muted font-medium">Membre depuis</p>
              <p className="text-[13px] font-bold text-base-soft">{fmtDate(profile?.created_at) || "—"}</p>
            </div>
          </div>
        </div>

        {/* ── AI USAGE ── */}
        <div className="card-glass rounded-3xl p-4">
          <div className="mb-3 flex items-center gap-2">
            <BotIcon className="h-4 w-4 text-accent-500" />
            <p className="text-sm font-semibold text-base-soft">ADF IA — Utilisation</p>
          </div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted">Messages envoyés</span>
            <span className="font-bold text-base">{used} / {limit}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full gradient-brand transition-all" style={{ width: `${pct}%` }} />
          </div>
          {pct >= 80 && (
            <p className="mt-1.5 text-[11px] text-amber-600 font-medium">
              ⚠ Vous approchez de votre limite de messages.
            </p>
          )}
        </div>

        {/* ── EDIT FORM ── */}
        <div className="card-glass space-y-3.5 rounded-3xl p-4">
          <p className="text-[12px] font-bold uppercase tracking-wider text-muted/70 mb-1">Modifier le profil</p>

          <Field label="Nom complet">
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
              <Input
                className="pl-10"
                placeholder="Votre nom complet"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </Field>

          <Field label="Téléphone">
            <div className="relative">
              <PhoneIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
              <Input
                className="pl-10"
                placeholder="+229 ..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </Field>

          <Field label="Adresse e-mail">
            <div className="relative">
              <MailIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
              <Input
                className="pl-10 bg-slate-50 text-muted cursor-not-allowed"
                value={profile?.email || "—"}
                readOnly
                disabled
              />
            </div>
            <span className="mt-1 text-[10px] text-muted">L'e-mail ne peut pas être modifié.</span>
          </Field>

          <Button full loading={saving} onClick={save}>
            <CheckCircleIcon className="h-4 w-4" /> Enregistrer les modifications
          </Button>
        </div>

        {/* ── PWA INSTALL ── */}
        <button onClick={install}
          className="card-glass flex w-full items-center gap-3 rounded-3xl p-4 text-left active:scale-[.99] transition">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-brand text-white">
            <DownloadIcon className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-base-soft">Installer l'application</p>
            <p className="text-xs text-muted">Ajouter ADF à l'écran d'accueil</p>
          </div>
        </button>

        {/* ── ADMIN PANEL ── */}
        {profile?.role === "admin" && (
          <Button full variant="secondary" onClick={() => go({ name: "admin" })}>
            <ShieldIcon className="h-4 w-4" /> Panneau d'administration
          </Button>
        )}

        {/* ── LOGOUT ── */}
        <Button full variant="danger" onClick={signOut}>
          <LogoutIcon className="h-4 w-4" /> Se déconnecter
        </Button>

        {/* ── FOOTER ── */}
        <div className="flex flex-col items-center text-center pt-2 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand shadow">
            <LogoMark size={28} />
          </div>
          <p className="mt-2 text-[11px] font-semibold text-muted/60">ADF — Arafat Digital Futurist</p>
          <p className="text-[11px] text-muted/40">Conçue par le PDG, M. Arafat Garga</p>
        </div>
      </div>
    </div>
  );
}

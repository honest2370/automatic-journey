import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useNav } from "../lib/nav";
import { uploadFile } from "../lib/supabase";
import { Button, Input, Field, Avatar, useToast, fmtDate } from "../components/ui";
import { Header } from "./Services";
import {
  UserIcon, PhoneIcon, MailIcon, LogoutIcon,
  BotIcon, DownloadIcon, ShieldIcon, SparkIcon, CheckCircleIcon,
} from "../lib/icons";

export default function Settings() {
  const { profile, signOut, updateMyProfile } = useAuth();
  const { back, go } = useNav();
  const toast = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [inited, setInited] = useState(false);

  // Sync from profile once loaded
  if (profile && !inited) {
    setName(profile.full_name || "");
    setPhone(profile.phone || "");
    setAvatar(profile.avatar_url || null);
    setInited(true);
  }

  const save = async () => {
    setSaving(true);
    await updateMyProfile({ full_name: name, phone, avatar_url: avatar });
    setSaving(false);
    toast({ type: "success", msg: "Profil mis à jour." });
  };

  const pickAvatar = async (f: File) => {
    if (!profile) return;
    const up = await uploadFile(profile.id, f, "avatars");
    if (up) {
      setAvatar(up.url);
      toast({ type: "success", msg: "Photo chargée. Enregistrez les modifications." });
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

  return (
    <div className="min-h-full bg-surface">
      <Header back={back} title="Profil & réglages" />
      <div className="px-4 pb-28 pt-2">
        {/* ——— Profile card ——— */}
        <div className="card-glass mb-4 rounded-3xl p-5">
          <div className="flex items-center gap-4">
            <label className="relative cursor-pointer shrink-0">
              <Avatar name={profile?.full_name || "?"} url={avatar} size={72} />
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full gradient-brand text-white shadow">
                <DownloadIcon className="h-3.5 w-3.5 rotate-180" />
              </span>
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && pickAvatar(e.target.files[0])} />
            </label>
            <div className="min-w-0">
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
        </div>

        {/* ——— AI usage ——— */}
        <div className="card-glass mb-4 rounded-3xl p-4">
          <div className="mb-2 flex items-center gap-2">
            <BotIcon className="h-4 w-4 text-accent-500" />
            <p className="text-sm font-semibold text-base-soft">ADF IA — Utilisation</p>
          </div>
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span>Messages envoyés</span>
            <span className="font-bold text-base">
              {profile?.ai_message_count ?? 0} / {profile?.ai_message_limit ?? 50}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full gradient-brand" style={{
              width: `${profile?.ai_message_limit ? Math.min(100, ((profile?.ai_message_count || 0) / profile.ai_message_limit) * 100) : 0}%`
            }} />
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Membre depuis le {fmtDate(profile?.created_at)}
          </p>
        </div>

        {/* ——— Edit form ——— */}
        <div className="card-glass space-y-3.5 rounded-3xl p-4">
          <Field label="Nom complet">
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
              <Input className="pl-10" placeholder="Votre nom" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </Field>
          <Field label="Téléphone">
            <div className="relative">
              <PhoneIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
              <Input className="pl-10" placeholder="+229 ..." value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </Field>
          <Field label="Adresse e-mail">
            <div className="relative">
              <MailIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
              <Input className="pl-10 bg-slate-50 text-muted" value={profile?.email || "—"} readOnly disabled />
            </div>
            <span className="mt-1 text-[10px] text-muted">L'e-mail ne peut pas être modifié.</span>
          </Field>
          <Button full loading={saving} onClick={save}>
            <CheckCircleIcon className="h-4 w-4" /> Enregistrer les modifications
          </Button>
        </div>

        {/* ——— Install ——— */}
        <button onClick={install}
          className="card-glass mt-4 flex w-full items-center gap-3 rounded-3xl p-4 text-left active:scale-[.99]">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-brand text-white">
            <DownloadIcon className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-base-soft">Installer l'application</p>
            <p className="text-xs text-muted">Ajouter ADF à l'écran d'accueil</p>
          </div>
        </button>

        {/* ——— Admin ——— */}
        {profile?.role === "admin" && (
          <Button full variant="secondary" className="mt-3" onClick={() => go({ name: "admin" })}>
            <SparkIcon className="h-4 w-4" /> Panneau d'administration
          </Button>
        )}

        {/* ——— Logout ——— */}
        <Button full variant="danger" className="mt-3" onClick={signOut}>
          <LogoutIcon className="h-4 w-4" /> Se déconnecter
        </Button>

        {/* ——— Footer ——— */}
        <div className="mt-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand shadow">
            <SparkIcon className="h-6 w-6 text-white" />
          </div>
          <p className="mt-2 text-[11px] font-semibold text-muted/60">ADF — Arafat Digital Futurist</p>
          <p className="text-[11px] text-muted/40">Conçue par le PDG, M. Arafat Garga</p>
        </div>
      </div>
    </div>
  );
}

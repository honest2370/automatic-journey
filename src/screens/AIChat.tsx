import { useCallback, useEffect, useRef, useState } from "react";
import { useNav } from "../lib/nav";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import {
  fetchAiConfig,
  generateReply,
  AI_SUGGESTIONS,
  type AiConfigResp,
  type AiContext,
  type AiMsg,
} from "../lib/ai";
import { fetchServices, fetchProducts } from "../lib/data";
import { IconButton, useToast, cn } from "../components/ui";
import {
  SendIcon, PlusIcon, ChevronLeftIcon, BotIcon,
  TrashIcon, MenuIcon, SparkIcon, CheckCircleIcon,
} from "../lib/icons";
import { LogoMark } from "../components/Logo";
import type { AiSession, AiMessage, Service, Product } from "../lib/types";

export default function AIChat() {
  const { route, go, replace, back } = useNav();
  const { profile, refreshProfile } = useAuth();
  const toast = useToast();

  const sessionId = route.params?.session as string | undefined;
  const [sessions, setSessions] = useState<AiSession[]>([]);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  // Keep a ref so processSend always sees latest messages without stale closure
  const messagesRef = useRef<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [config, setConfig] = useState<AiConfigResp | null>(null);
  const [source, setSource] = useState<"online" | "local" | null>(null);
  const [ctx, setCtx] = useState<AiContext>({ services: [], products: [] });
  const [sidebar, setSidebar] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Keep messagesRef in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const loadSessions = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from("ai_sessions").select("*").eq("user_id", profile.id)
      .order("updated_at", { ascending: false });
    setSessions((data as AiSession[]) || []);
  }, [profile?.id]);

  const loadMessagesFromDB = useCallback(async (sid: string) => {
    const { data } = await supabase
      .from("ai_messages").select("*").eq("session_id", sid)
      .order("created_at", { ascending: true });
    const msgs = (data as AiMessage[]) || [];
    setMessages(msgs);
    messagesRef.current = msgs;
  }, []);

  useEffect(() => {
    loadSessions();
    fetchAiConfig().then(setConfig).catch(() => setConfig(null));
    Promise.all([fetchServices(), fetchProducts()])
      .then(([s, p]) => setCtx({ services: s as Service[], products: p as Product[] }))
      .catch(() => {});
  }, [loadSessions]);

  useEffect(() => {
    if (sessionId) { loadMessagesFromDB(sessionId); }
    else { setMessages([]); messagesRef.current = []; }
    setSource(null);
  }, [sessionId, loadMessagesFromDB]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  // Core send — uses messagesRef to avoid stale closure
  const processSend = async (text: string, sid: string) => {
    if (!profile || !text.trim()) return;
    if (profile.ai_message_count >= profile.ai_message_limit) {
      toast({ type: "error", msg: `Limite atteinte (${profile.ai_message_limit} messages).` });
      return;
    }
    const content = text.trim();
    setBusy(true);

    // Optimistically add user message
    const userMsg: AiMessage = {
      id: crypto.randomUUID(), session_id: sid, role: "user",
      content, created_at: new Date().toISOString(),
    };
    setMessages((prev) => { const next = [...prev, userMsg]; messagesRef.current = next; return next; });

    // Persist user message (non-blocking)
    supabase.from("ai_messages").insert({ session_id: sid, role: "user", content }).then(() => {});

    // Build history from the ref (always current)
    const history: AiMsg[] = messagesRef.current
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    // Generate reply (local always works even without API)
    const { text: reply, source: src } = await generateReply(history, config, ctx);
    setSource(src);

    const asstMsg: AiMessage = {
      id: crypto.randomUUID(), session_id: sid, role: "assistant",
      content: reply, created_at: new Date().toISOString(),
    };
    setMessages((prev) => { const next = [...prev, asstMsg]; messagesRef.current = next; return next; });

    // Persist assistant message (non-blocking)
    supabase.from("ai_messages").insert({ session_id: sid, role: "assistant", content: reply }).then(() => {});

    setBusy(false);
    refreshProfile();
    loadSessions();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Start a brand-new conversation then send the first message
  const startChat = async (text: string) => {
    if (!profile || !text.trim() || busy) return;
    const content = text.trim();
    setInput("");
    setBusy(true);

    const { data: s, error: sErr } = await supabase
      .from("ai_sessions")
      .insert({ user_id: profile.id, title: content.slice(0, 40) })
      .select().single();

    if (sErr || !s) {
      toast({ type: "error", msg: "Impossible de créer la conversation." });
      setBusy(false);
      return;
    }

    const sid = s.id;
    // Navigate to session before sending so UI shows the session
    replace({ name: "ai", params: { session: sid } });

    // Reset messages for fresh session
    setMessages([]);
    messagesRef.current = [];
    setBusy(false); // processSend will set it again

    await processSend(content, sid);
  };

  const send = () => {
    const text = input.trim();
    if (!text || !sessionId || busy) return;
    setInput("");
    processSend(text, sessionId);
  };

  const del = async (id: string) => {
    await supabase.from("ai_messages").delete().eq("session_id", id);
    await supabase.from("ai_sessions").delete().eq("id", id);
    if (sessionId === id) go({ name: "ai" });
    loadSessions();
  };

  const limit = profile?.ai_message_limit || 50;
  const used = profile?.ai_message_count || 0;
  const isOnline = !!(config?.ai_enabled && config?.api_key);

  return (
    <div className="relative flex h-dvh flex-col" style={{ background: "#f8fafc" }}>

      {/* ── SIDEBAR ── */}
      {sidebar && (
        <div className="absolute inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebar(false)} />
          <div className="relative z-10 flex w-72 flex-col bg-white shadow-2xl border-r border-slate-100 animate-fade h-full">
            <div className="bg-gradient-to-br from-[#060c20] to-[#0a3d6e] px-4 pt-12 pb-4 safe-top">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LogoMark size={28} />
                  <div>
                    <p className="text-[13px] font-bold text-white">ADF IA</p>
                    <p className="text-[10px] text-white/50">Conversations</p>
                  </div>
                </div>
                <IconButton onClick={() => { setSidebar(false); go({ name: "ai" }); }}>
                  <PlusIcon className="h-5 w-5 text-white" />
                </IconButton>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {sessions.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted">Aucune conversation.</p>
              ) : sessions.map((s) => (
                <div key={s.id} className={cn("group flex items-center gap-2 rounded-xl px-2.5 py-2.5 text-left transition", s.id === sessionId ? "bg-accent-50" : "hover:bg-slate-50")}>
                  <button className="min-w-0 flex-1 text-left" onClick={() => { setSidebar(false); go({ name: "ai", params: { session: s.id } }); }}>
                    <p className="truncate text-[13px] font-medium text-base-soft">{s.title}</p>
                    <p className="text-[10px] text-muted">{new Date(s.updated_at).toLocaleDateString("fr-FR")}</p>
                  </button>
                  <button onClick={() => del(s.id)} className="hidden group-hover:flex p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg">
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="safe-top shrink-0 z-30 bg-gradient-to-r from-[#060c20] to-[#0a3d6e]">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <button onClick={back} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/10">
            <ChevronLeftIcon className="h-5 w-5 text-white/80" />
          </button>
          <button onClick={() => setSidebar(true)} className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand shadow shadow-cyan-500/30">
              <LogoMark size={22} />
            </span>
            <div className="min-w-0 text-left">
              <p className="truncate text-[15px] font-bold text-white">ADF IA</p>
              <p className="flex items-center gap-1 text-[10px] text-white/50">
                {isOnline
                  ? <><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />En ligne — {config?.provider}</>
                  : <><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Mode local</>}
              </p>
            </div>
          </button>
          <button onClick={() => go({ name: "ai" })} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/10">
            <PlusIcon className="h-5 w-5 text-white/80" />
          </button>
          <button onClick={() => setSidebar(true)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/10">
            <MenuIcon className="h-5 w-5 text-white/80" />
          </button>
        </div>
      </header>

      {/* ── CHAT AREA ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar">
        {!sessionId ? (
          <div className="flex min-h-full flex-col items-center px-5 py-8 animate-fade">
            {/* Brand hero */}
            <div className="mb-5 flex flex-col items-center">
              <div className="relative mb-3">
                <div className="absolute inset-0 rounded-3xl bg-cyan-400/30 blur-2xl scale-110" />
                <div className="relative flex h-18 w-18 items-center justify-center rounded-3xl gradient-brand shadow-xl shadow-cyan-500/30" style={{ height: 72, width: 72 }}>
                  <LogoMark size={42} />
                </div>
              </div>
              <h2 className="text-[20px] font-extrabold text-base text-center">Bonjour, je suis ADF IA</h2>
              <p className="mt-1 max-w-xs text-center text-[13px] text-muted leading-relaxed">
                Votre assistant pour découvrir nos services, commander et explorer la boutique ADF.
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", isOnline ? "bg-emerald-400" : "bg-amber-400")} />
                <span className="text-[11px] font-medium text-muted">
                  {isOnline ? `En ligne · ${config?.provider}` : "Mode hors-ligne actif"}
                </span>
              </div>
            </div>

            {/* Usage bar */}
            <div className="w-full max-w-sm mb-4">
              <div className="flex items-center justify-between text-[10px] text-muted/60 mb-1">
                <span>Messages utilisés</span>
                <span className="font-semibold">{used}/{limit}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full gradient-brand rounded-full transition-all" style={{ width: `${limit ? Math.min(100, (used / limit) * 100) : 0}%` }} />
              </div>
            </div>

            {/* Suggestions */}
            <div className="w-full max-w-sm space-y-2 mb-5">
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">Suggestions</p>
              {AI_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => startChat(s)}
                  disabled={busy}
                  className="flex items-center gap-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-accent-300 hover:bg-accent-50/50 active:scale-[.98] disabled:opacity-50"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-500">
                    <SparkIcon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-[13px] text-base-soft">{s}</span>
                </button>
              ))}
            </div>

            {sessions.length > 0 && (
              <div className="w-full max-w-sm">
                <p className="mb-2 text-[11px] font-semibold text-muted uppercase tracking-wider">Conversations récentes</p>
                {sessions.slice(0, 4).map((s) => (
                  <button key={s.id} onClick={() => go({ name: "ai", params: { session: s.id } })}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left hover:bg-slate-100 transition">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg gradient-brand">
                      <BotIcon className="h-3.5 w-3.5 text-white" />
                    </span>
                    <span className="truncate text-[13px] text-base-soft">{s.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : messages.length === 0 && !busy ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted">Écrivez ci-dessous pour démarrer.</p>
          </div>
        ) : (
          <div className="space-y-5 px-4 py-6">
            {messages.map((m) => <MsgBubble key={m.id} role={m.role} content={m.content} />)}
            {busy && <Typing />}
          </div>
        )}
      </div>

      {/* ── USAGE BAR (in-session) ── */}
      {sessionId && (
        <div className="shrink-0 px-4 pt-1 pb-0.5">
          <div className="flex items-center justify-between text-[10px] text-muted/60">
            <span>{used}/{limit} messages</span>
            {source && (
              <span className="flex items-center gap-1">
                <CheckCircleIcon className="h-3 w-3" />
                {source === "online" ? "En ligne" : "Mode local"}
              </span>
            )}
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full gradient-brand transition-all" style={{ width: `${limit ? Math.min(100, (used / limit) * 100) : 0}%` }} />
          </div>
        </div>
      )}

      {/* ── COMPOSER — raised up with explicit bottom padding ── */}
      <div className="shrink-0 border-t border-slate-100 bg-white/95 backdrop-blur px-3 pt-2.5 pb-3" style={{ paddingBottom: `calc(12px + env(safe-area-inset-bottom))` }}>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!input.trim() || busy) return;
                if (sessionId) send();
                else startChat(input);
              }
            }}
            placeholder="Message ADF IA…"
            className="max-h-28 min-h-[44px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[15px] text-base placeholder:text-muted/50 outline-none transition focus:border-accent-300 focus:ring-2 focus:ring-accent-100 focus:bg-white"
          />
          <button
            onClick={() => {
              if (!input.trim() || busy) return;
              if (sessionId) send();
              else startChat(input);
            }}
            disabled={busy || !input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl gradient-brand text-white active:scale-90 disabled:opacity-40 transition shadow-md shadow-accent-500/30"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MsgBubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const mine = role === "user";
  return (
    <div className={cn("flex gap-3", mine ? "flex-row-reverse" : "flex-row")}>
      {!mine && (
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl gradient-brand shadow shadow-accent-500/20">
          <LogoMark size={18} />
        </span>
      )}
      <div className={cn(
        "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[14px] leading-relaxed",
        mine
          ? "gradient-brand text-white rounded-br-md shadow-md shadow-accent-500/20"
          : "bg-white border border-slate-100 text-base-soft rounded-bl-md shadow-sm"
      )}>
        {content}
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl gradient-brand">
        <LogoMark size={18} />
      </span>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white border border-slate-100 px-4 py-3 shadow-sm">
        <span className="dot h-2 w-2 rounded-full bg-accent-400" />
        <span className="dot mx-1 h-2 w-2 rounded-full bg-accent-400" />
        <span className="dot h-2 w-2 rounded-full bg-accent-400" />
      </div>
    </div>
  );
}

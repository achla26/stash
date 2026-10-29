"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Send,
  Trash2,
  Settings2,
  FileText,
  Link2,
  BookOpen,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLinks } from "@/hooks/use-links";
import { useNotes } from "@/hooks/use-notes";
import { useWords } from "@/hooks/use-words";
import { useNotebooks } from "@/hooks/use-notebooks";
import {
  getAIConfig,
  askAI,
  askStashAI,
  getStashAIUsage,
  SYSTEM_PROMPT,
  type ChatTurn,
  type AIConfig,
  type StashSource,
} from "@/lib/ai";
import { buildSnapshot } from "@/lib/ai-snapshot";
import { MarkdownPreview } from "@/components/notes/markdown-preview";

const CHIPS = [
  "Summarize my latest note",
  "Last 5 links",
  "Which words are not mastered?",
  "What did I add this week?",
];

const SOURCE_ICON = {
  note: FileText,
  link: Link2,
  word: BookOpen,
} as const;

const SOURCE_TINT = {
  note: "#34C759",
  link: "#0A84FF",
  word: "#FF9500",
} as const;

function SourceChips({
  sources,
}: {
  sources: StashSource[];
}) {
  const router = useRouter();
  if (sources.length === 0) return null;
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {sources.map((s) => {
        const Icon = SOURCE_ICON[s.type];
        const tint = SOURCE_TINT[s.type];
        return (
          <button
            key={`${s.type}-${s.id}`}
            type="button"
            onClick={() => {
              if (s.type === "note") router.push(`/notes/${s.id}`);
              else if (s.type === "word") router.push("/words");
              else router.push("/links");
            }}
            className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-transform hover:scale-[1.03]"
            style={{
              backgroundColor: `color-mix(in srgb, ${tint} 12%, transparent)`,
              color: tint,
            }}
            title={s.title}
          >
            <Icon className="h-3 w-3 shrink-0" />
            <span className="truncate">{s.title}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ChatDashboard() {
  const [cfg, setCfg] = useState<AIConfig | null>(() => getAIConfig());
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [useStash, setUseStash] = useState(true);
  const [usage, setUsage] = useState<{
    used: number;
    limit: number;
    plan: string;
  } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const { data: links = [] } = useLinks();
  const { data: notes = [] } = useNotes();
  const { data: words = [] } = useWords();
  const { data: notebooks = [] } = useNotebooks();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  useEffect(() => {
    const c = getAIConfig();
    setCfg(c);
    if (!c) getStashAIUsage().then(setUsage);
  }, []);

  async function send(text: string) {
    const t = text.trim();
    const c = getAIConfig();
    if (!t || pending) return;
    setCfg(c);
    setInput("");
    setError("");
    const history = [...messages, { role: "user" as const, text: t }];
    setMessages(history);
    setPending(true);
    try {
      if (c) {
        // Own-key mode: client snapshot context (toggle se control)
        const snapshot = useStash
          ? buildSnapshot({ links, notes, words, notebooks })
          : "";
        const system = snapshot
          ? `${SYSTEM_PROMPT}\n\nDATA:\n${snapshot}`
          : SYSTEM_PROMPT;
        const tooBig = /too large|tokens per minute|tpm/i;
        try {
          const reply = await askAI({
            provider: c.provider,
            key: c.key,
            system,
            history: history.slice(0, -1).slice(-4),
            message: t,
          });
          setMessages((m) => [...m, { role: "assistant", text: reply }]);
        } catch (e1) {
          if (!tooBig.test((e1 as Error).message)) throw e1;
          // Payload chhota karke ek retry
          const reply = await askAI({
            provider: c.provider,
            key: c.key,
            system: SYSTEM_PROMPT,
            history: history.slice(0, -1).slice(-2),
            message: t,
          });
          setMessages((m) => [...m, { role: "assistant", text: reply }]);
        }
      } else {
        // Server mode: targeted RAG on the backend
        const { text: reply, sources } = await askStashAI({
          system: SYSTEM_PROMPT,
          history: history.slice(0, -1).slice(-8),
          message: t,
          useStash,
        });
        setMessages((m) => [
          ...m,
          { role: "assistant", text: reply, sources },
        ]);
        getStashAIUsage().then(setUsage);
      }
    } catch (e) {
      setError((e as Error).message || "AI request failed");
    }
    setPending(false);
  }

  return (
    <div className="proto-chat-wrap">
      <div className="proto-chat-options"><button type="button" onClick={() => setUseStash(v => !v)} aria-pressed={useStash}><Database size={14}/> {useStash ? "Using your stash as context" : "Stash context off"}</button>{usage && <span>{usage.used}/{usage.limit} chats today</span>}<Link href="/settings">AI settings</Link>{messages.length > 0 && <button onClick={() => { setMessages([]); setError(""); }} aria-label="Clear chat"><Trash2 size={15}/></button>}</div>
      <div className="proto-chat-thread" aria-live="polite">
        <div className="proto-chat-msg assistant"><span className="proto-chat-avatar"><Sparkles size={15}/></span><div className="proto-chat-bubble">Hi! Ask me about your saved links, notes and words. What would you like to find?</div></div>
        {messages.map((m,i) => m.role === "user" ? <div key={i} className="proto-chat-msg user"><span className="proto-chat-avatar">You</span><div className="proto-chat-bubble">{m.text}</div></div> : <div key={i} className="proto-chat-msg assistant"><span className="proto-chat-avatar"><Sparkles size={15}/></span><div className="min-w-0"><div className="proto-chat-bubble"><MarkdownPreview text={m.text} compact/></div>{m.sources && m.sources.length > 0 && <SourceChips sources={m.sources}/>}</div></div>)}
        {pending && <div className="proto-chat-msg assistant"><span className="proto-chat-avatar"><Sparkles size={15}/></span><div className="proto-chat-bubble">Thinking…</div></div>}
        {error && <p role="alert" className="proto-chat-error">{error}</p>}<div ref={endRef}/>
      </div>
      <div className="proto-chat-chips">{CHIPS.map(c => <button key={c} onClick={() => send(c)} disabled={pending}>{c}</button>)}</div>
      <form onSubmit={e => { e.preventDefault(); send(input); }} className="proto-chat-composer"><label className="sr-only" htmlFor="chat-message">Message the assistant</label><input id="chat-message" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about your stash…"/><button type="submit" disabled={pending || !input.trim()} aria-label="Send"><Send size={16}/></button></form>
      <p className="proto-chat-mode">{cfg ? `Using ${cfg.provider} with your key stored on this device.` : "Using the server's AI configuration. Responses may be inaccurate."}</p>
    </div>
  );
}

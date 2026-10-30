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
    <div className="mx-auto flex min-h-[calc(100vh-210px)] w-full min-w-0 max-w-[760px] flex-col">
      <div className="flex flex-wrap items-center gap-2.5 text-[11.5px] text-muted-foreground [&_button]:inline-flex [&_button]:items-center [&_button]:gap-[5px] [&_button]:rounded-lg [&_button]:bg-accent [&_button]:px-[9px] [&_button]:py-1.5 [&_a]:font-bold [&_a]:text-primary"><button type="button" onClick={() => setUseStash(v => !v)} aria-pressed={useStash}><Database size={14}/> {useStash ? "Using your stash as context" : "Stash context off"}</button>{usage && <span>{usage.used}/{usage.limit} chats today</span>}<Link href="/settings">AI settings</Link>{messages.length > 0 && <button onClick={() => { setMessages([]); setError(""); }} aria-label="Clear chat"><Trash2 size={15}/></button>}</div>
      <div className="flex min-h-[240px] max-h-[55vh] flex-1 flex-col gap-4 overflow-y-auto pb-5 pt-1 before:min-h-0 before:flex-1 before:content-['']" aria-live="polite">
        <div className="flex max-w-[88%] gap-[11px]"><span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-primary text-[10px] font-extrabold text-primary-foreground"><Sparkles size={15}/></span><div className="whitespace-pre-wrap break-words rounded-[14px] border border-border bg-card px-3.5 py-[11px] text-sm leading-normal [overflow-wrap:anywhere]">Hi! Ask me about your saved links, notes and words. What would you like to find?</div></div>
        {messages.map((m,i) => m.role === "user" ? <div key={i} className="ml-auto flex max-w-[88%] flex-row-reverse gap-[11px] [&>span]:bg-accent [&>span]:text-muted-foreground [&>div]:border-transparent [&>div]:bg-foreground [&>div]:text-background"><span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-primary text-[10px] font-extrabold text-primary-foreground">You</span><div className="whitespace-pre-wrap break-words rounded-[14px] border border-border bg-card px-3.5 py-[11px] text-sm leading-normal [overflow-wrap:anywhere]">{m.text}</div></div> : <div key={i} className="flex max-w-[88%] gap-[11px]"><span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-primary text-[10px] font-extrabold text-primary-foreground"><Sparkles size={15}/></span><div className="min-w-0"><div className="whitespace-pre-wrap break-words rounded-[14px] border border-border bg-card px-3.5 py-[11px] text-sm leading-normal [overflow-wrap:anywhere]"><MarkdownPreview text={m.text} compact/></div>{m.sources && m.sources.length > 0 && <SourceChips sources={m.sources}/>}</div></div>)}
        {pending && <div className="flex max-w-[88%] gap-[11px]"><span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-primary text-[10px] font-extrabold text-primary-foreground"><Sparkles size={15}/></span><div className="whitespace-pre-wrap break-words rounded-[14px] border border-border bg-card px-3.5 py-[11px] text-sm leading-normal [overflow-wrap:anywhere]">Thinking…</div></div>}
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}<div ref={endRef}/>
      </div>
      <div className="mb-3 flex flex-wrap gap-2 [&_button]:min-h-9 [&_button]:rounded-full [&_button]:border [&_button]:border-border [&_button]:bg-card [&_button]:px-[13px] [&_button]:py-[7px] [&_button]:text-[12.5px] [&_button]:font-semibold [&_button]:text-muted-foreground [&_button:disabled]:opacity-50">{CHIPS.map(c => <button key={c} onClick={() => send(c)} disabled={pending}>{c}</button>)}</div>
      <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex items-center gap-2.5 rounded-2xl border border-border bg-card p-[7px] [&_input]:min-w-0 [&_input]:flex-1 [&_input]:border-0 [&_input]:bg-transparent [&_input]:pl-2.5 [&_input]:pr-1.5 [&_input]:text-[14.5px] [&_input]:outline-none [&_button]:grid [&_button]:h-[38px] [&_button]:w-[38px] [&_button]:shrink-0 [&_button]:place-items-center [&_button]:rounded-full [&_button]:bg-primary [&_button]:text-primary-foreground [&_button:disabled]:opacity-50"><label className="sr-only" htmlFor="chat-message">Message the assistant</label><input id="chat-message" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about your stash…"/><button type="submit" disabled={pending || !input.trim()} aria-label="Send"><Send size={16}/></button></form>
      <p className="mt-2.5 text-center text-xs text-muted-foreground">{cfg ? `Using ${cfg.provider} with your key stored on this device.` : "Using the server's AI configuration. Responses may be inaccurate."}</p>
    </div>
  );
}

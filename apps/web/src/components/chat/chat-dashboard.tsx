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
    <div className="mx-auto flex h-[calc(100dvh-11rem)] max-w-3xl flex-col md:h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--primary), #af52de)",
            }}
          >
            <Sparkles className="h-5 w-5 text-white" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              AI Chat
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Your study buddy — answers from your own stash.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          {usage && usage.plan !== "pro" && (
            <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
              {usage.used}/{usage.limit} today
            </span>
          )}
          {!cfg && (
            <Link
              href="/settings"
              className="hidden items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground sm:flex"
            >
              <Settings2 className="h-3 w-3" /> own key (optional)
            </Link>
          )}
          {messages.length > 0 && (
            <button
              onClick={() => {
                setMessages([]);
                setError("");
              }}
              aria-label="Clear chat"
              className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Stash context toggle */}
      {(
        <button
          type="button"
          onClick={() => setUseStash((v) => !v)}
          className={cn(
            "mb-3 flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            useStash
              ? "bg-primary/10 text-primary"
              : "bg-accent text-muted-foreground"
          )}
        >
          <Database className="h-3.5 w-3.5" />
          {useStash ? "Using your stash as context" : "Stash context off"}
          <span
            className={cn(
              "ml-1 flex h-4 w-7 items-center rounded-full p-0.5 transition-colors",
              useStash ? "bg-primary" : "bg-muted-foreground/40"
            )}
          >
            <span
              className={cn(
                "h-3 w-3 rounded-full bg-white transition-transform",
                useStash && "translate-x-3"
              )}
            />
          </span>
        </button>
      )}

      {/* Thread */}
      <div className="soft-shadow flex-1 space-y-4 overflow-y-auto rounded-3xl border border-border bg-card p-4 sm:p-5">
        {messages.length === 0 && !pending && (
          <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-3xl"
              style={{
                backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
              }}
            >
              <Sparkles className="h-6 w-6 text-primary" />
            </span>
            <div>
              <p className="text-lg font-extrabold tracking-tight">
                Ask your stash anything.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                It reads your notes, links and words to answer.
              </p>
            </div>
            <div className="flex max-w-md flex-wrap justify-center gap-2">
              {CHIPS.map((c) => (
                <button
                  key={c}
                  onClick={() => send(c)}
                  className="rounded-full border border-border bg-background px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div
                className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed text-white [overflow-wrap:anywhere]"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--primary), #4da3ff)",
                }}
              >
                {m.text}
              </div>
            </div>
          ) : (
            <div key={i} className="flex items-start gap-2.5">
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--primary), #af52de)",
                }}
              >
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </span>
              <div className="max-w-[85%] min-w-0">
                <div className="rounded-2xl rounded-tl-md border border-border bg-background px-4 py-2.5 text-sm leading-relaxed [overflow-wrap:anywhere]">
                  <MarkdownPreview text={m.text} compact />
                </div>
                {m.sources && m.sources.length > 0 && (
                  <SourceChips sources={m.sources} />
                )}
              </div>
            </div>
          )
        )}

        {pending && (
          <div className="flex items-start gap-2.5">
            <span
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--primary), #af52de)",
              }}
            >
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </span>
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-md border border-border bg-background px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:240ms]" />
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="soft-shadow mt-3 flex items-center gap-2 rounded-full border border-border bg-card py-1.5 pl-5 pr-1.5"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your links, notes, words…"
          className="h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          aria-label="Send"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--primary), #4da3ff)",
          }}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

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

function SourceChips({ sources }: { sources: StashSource[] }) {
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

function ChatMessage({
  user = false,
  children,
}: {
  user?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex max-w-[88%] gap-[11px]",
        user && "ml-auto flex-row-reverse",
      )}
    >
      <span
        className={cn(
          "grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full text-[10px] font-extrabold",
          user
            ? "bg-accent text-muted-foreground"
            : "bg-primary text-primary-foreground",
        )}
      >
        {user ? "You" : <Sparkles size={15} />}
      </span>
      <div
        className={cn(
          "min-w-0 whitespace-pre-wrap break-words rounded-[var(--radius-dialog)] border border-border bg-card px-3.5 py-[11px] text-sm leading-normal",
          user && "border-transparent bg-foreground text-background",
        )}
      >
        {children}
      </div>
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
        setMessages((m) => [...m, { role: "assistant", text: reply, sources }]);
        getStashAIUsage().then(setUsage);
      }
    } catch (e) {
      setError((e as Error).message || "AI request failed");
    }
    setPending(false);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-210px)] w-full min-w-0 max-w-[760px] flex-col">
      <div className="flex flex-wrap items-center gap-2.5 text-[11.5px] text-muted-foreground">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-accent px-2.5 py-1.5"
          onClick={() => setUseStash((v) => !v)}
          aria-pressed={useStash}
        >
          <Database size={14} />{" "}
          {useStash ? "Using your stash as context" : "Stash context off"}
        </button>
        {usage && (
          <span>
            {usage.used}/{usage.limit} chats today
          </span>
        )}
        <Link className="font-bold text-primary" href="/settings">
          AI settings
        </Link>
        {messages.length > 0 && (
          <button
            className="rounded-[var(--radius-control)] bg-accent p-1.5"
            onClick={() => {
              setMessages([]);
              setError("");
            }}
            aria-label="Clear chat"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
      <div
        className="flex min-h-[240px] max-h-[55vh] flex-1 flex-col gap-4 overflow-y-auto pb-5 pt-1 before:min-h-0 before:flex-1 before:content-['']"
        aria-live="polite"
      >
        <ChatMessage>
          Hi! Ask me about your saved links, notes and words. What would you
          like to find?
        </ChatMessage>
        {messages.map((message, index) => (
          <ChatMessage key={index} user={message.role === "user"}>
            {message.role === "user" ? (
              message.text
            ) : (
              <MarkdownPreview text={message.text} compact />
            )}
            {message.sources && message.sources.length > 0 && (
              <SourceChips sources={message.sources} />
            )}
          </ChatMessage>
        ))}
        {pending && <ChatMessage>Thinking…</ChatMessage>}
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        <div ref={endRef} />
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {CHIPS.map((chip) => (
          <button
            key={chip}
            className="min-h-9 rounded-full border border-border bg-card px-[13px] py-[7px] text-[12.5px] font-semibold text-muted-foreground disabled:opacity-50"
            onClick={() => send(chip)}
            disabled={pending}
          >
            {chip}
          </button>
        ))}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2.5 rounded-2xl border border-border bg-card p-[7px]"
      >
        <label className="sr-only" htmlFor="chat-message">
          Message the assistant
        </label>
        <input
          id="chat-message"
          className="min-w-0 flex-1 border-0 bg-transparent pl-2.5 pr-1.5 text-[14.5px] outline-none"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about your stash…"
        />
        <button
          type="submit"
          className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
          disabled={pending || !input.trim()}
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </form>
      <p className="mt-2.5 text-center text-xs text-muted-foreground">
        {cfg
          ? `Using ${cfg.provider} with your key stored on this device.`
          : "Using the server's AI configuration. Responses may be inaccurate."}
      </p>
    </div>
  );
}

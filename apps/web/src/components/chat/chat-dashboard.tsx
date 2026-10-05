"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, Send, Trash2, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLinks } from "@/hooks/use-links";
import { useNotes } from "@/hooks/use-notes";
import { useWords } from "@/hooks/use-words";
import { useNotebooks } from "@/hooks/use-notebooks";
import {
  getAIConfig,
  askAI,
  SYSTEM_PROMPT,
  type ChatTurn,
  type AIConfig,
} from "@/lib/ai";
import { buildSnapshot } from "@/lib/ai-snapshot";

const CHIPS = [
  "Last 5 links",
  "Summarize my latest note",
  "What did I add this week?",
  "Which words are not mastered?",
];

export function ChatDashboard() {
  const [cfg, setCfg] = useState<AIConfig | null>(() => getAIConfig());
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const { data: links = [] } = useLinks();
  const { data: notes = [] } = useNotes();
  const { data: words = [] } = useWords();
  const { data: notebooks = [] } = useNotebooks();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  useEffect(() => {
    setCfg(getAIConfig());
  }, []);

  async function send(text: string) {
    const t = text.trim();
    const c = getAIConfig();
    if (!t || pending || !c) return;
    setCfg(c);
    setInput("");
    setError("");
    const history = [...messages, { role: "user" as const, text: t }];
    setMessages(history);
    setPending(true);
    try {
      const snapshot = buildSnapshot({ links, notes, words, notebooks });
      const reply = await askAI({
        provider: c.provider,
        key: c.key,
        system: `${SYSTEM_PROMPT}\n\nDATA:\n${snapshot}`,
        history: history.slice(0, -1).slice(-8),
        message: t,
      });
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (e) {
      setError((e as Error).message || "AI request failed");
    }
    setPending(false);
  }

  if (!cfg) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-10 text-center">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="mt-3 text-lg font-extrabold tracking-wide">AI CHAT</h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Add your free Groq or Gemini API key in Settings to chat with your
            data — summaries, last links, word quizzes and more. Your key stays
            on this device only.
          </p>
          <Link href="/settings" className="mt-5">
            <Button>
              <Settings2 className="h-4 w-4" /> Open Settings
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-extrabold tracking-wide">
          <Sparkles className="h-5 w-5 text-primary" /> AI CHAT
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10.5px] font-bold uppercase text-muted-foreground">
            {cfg.provider}
          </span>
        </h1>
        {messages.length > 0 && (
          <button
            onClick={() => {
              setMessages([]);
              setError("");
            }}
            aria-label="Clear chat"
            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border bg-card p-4">
        {messages.length === 0 && !pending && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">
              Ask anything about your Stash data.
            </p>
            <div className="flex max-w-md flex-wrap justify-center gap-2">
              {CHIPS.map((c) => (
                <button
                  key={c}
                  onClick={() => send(c)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background"
              )}
            >
              {m.text}
            </div>
          </div>
        ))}

        {pending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl border border-border bg-background px-4 py-3">
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your links, notes, words…"
          className="h-11 flex-1"
        />
        <Button type="submit" disabled={pending || !input.trim()} className="h-11 px-5">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

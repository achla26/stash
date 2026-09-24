"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   Tiny markdown preview (dependency-free, safe React nodes)
   Shared by note editor + public share page
   ============================================================ */

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex =
    /(<mark style="background-color:#[0-9a-fA-F]{3,8}">[^<]*<\/mark>|<span style="color:#[0-9a-fA-F]{3,8}">[^<]*<\/span>|!\[[^\]]*\]\([^)\s]+\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${keyBase}-${i++}`;
    if (tok.startsWith("<mark")) {
      const mm = tok.match(
        /<mark style="background-color:(#[0-9a-fA-F]{3,8})">([^<]*)<\/mark>/
      );
      if (mm) {
        nodes.push(
          <mark
            key={k}
            style={{ backgroundColor: mm[1] }}
            className="rounded px-0.5 text-foreground"
          >
            {mm[2]}
          </mark>
        );
      }
    } else if (tok.startsWith("<span")) {
      const mm = tok.match(
        /<span style="color:(#[0-9a-fA-F]{3,8})">([^<]*)<\/span>/
      );
      if (mm) {
        nodes.push(
          <span key={k} style={{ color: mm[1] }}>
            {mm[2]}
          </span>
        );
      }
    } else if (tok.startsWith("![")) {
      const mm = tok.match(/!\[([^\]]*)\]\(([^)\s]+)\)/);
      const src = mm?.[2] ?? "";
      const safe = /^(\/api\/uploads\/|https?:\/\/)/.test(src);
      if (mm && safe) {
        nodes.push(
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={k}
            src={src}
            alt={mm[1]}
            loading="lazy"
            className="my-4 max-w-full rounded-xl border border-border"
          />
        );
      }
    } else if (tok.startsWith("**")) {
      nodes.push(
        <strong key={k} className="font-semibold text-foreground">
          {tok.slice(2, -2)}
        </strong>
      );
    } else if (tok.startsWith("`")) {
      nodes.push(
        <code
          key={k}
          className="rounded bg-accent px-1 py-0.5 font-mono text-[0.85em]"
        >
          {tok.slice(1, -1)}
        </code>
      );
    } else if (tok.startsWith("*") || tok.startsWith("_")) {
      nodes.push(<em key={k}>{tok.slice(1, -1)}</em>);
    } else {
      const mm = tok.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (mm) {
        nodes.push(
          <a
            key={k}
            href={mm[2]}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-2"
          >
            {mm[1]}
          </a>
        );
      }
    }
    last = m.index + tok.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function isBlockStart(line: string): boolean {
  return (
    /^#{1,3}\s?/.test(line) ||
    /^>\s?/.test(line) ||
    /^[-*]\s/.test(line) ||
    /^\d+\.\s/.test(line) ||
    line.startsWith("```") ||
    /^[-*]\s\[[ xX]\]\s/.test(line) ||
    /^!\[[^\]]*\]\([^)\s]+\)\s*$/.test(line)
  );
}

export function MarkdownPreview({ text }: { text: string }) {
  // iOS/paste lookalikes → ascii so markdown always converts
  text = text.replace(/[*＊∗✱⁎]/g, "*").replace(/ /g, " ");
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (line.startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !(lines[i] ?? "").startsWith("```")) {
        buf.push(lines[i] ?? "");
        i++;
      }
      i++; // closing fence
      out.push(
        <pre
          key={key++}
          className="my-3 overflow-x-auto rounded-xl border border-border bg-accent/50 p-3 font-mono text-[13px] leading-relaxed"
        >
          {buf.join("\n")}
        </pre>
      );
      continue;
    }

    // standalone image line
    const imgLine = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/);
    if (imgLine) {
      const safe = /^(\/api\/uploads\/|https?:\/\/)/.test(imgLine[2] ?? "");
      out.push(
        <p key={key++} className="my-3">
          {safe && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgLine[2]}
              alt={imgLine[1]}
              loading="lazy"
              className="max-w-full rounded-xl border border-border"
            />
          )}
        </p>
      );
      i++;
      continue;
    }

    if (/^###\s?/.test(line)) {
      out.push(
        <h3 key={key++} className="mt-5 mb-1.5 text-lg font-semibold">
          {renderInline(line.replace(/^###\s?/, ""), `h3${key}`)}
        </h3>
      );
      i++;
      continue;
    }
    if (/^##\s?/.test(line)) {
      out.push(
        <h2 key={key++} className="mt-6 mb-2 text-xl font-bold">
          {renderInline(line.replace(/^##\s?/, ""), `h2${key}`)}
        </h2>
      );
      i++;
      continue;
    }
    if (/^#\s?/.test(line)) {
      out.push(
        <h1 key={key++} className="mt-6 mb-2 text-2xl font-bold">
          {renderInline(line.replace(/^#\s?/, ""), `h1${key}`)}
        </h1>
      );
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      out.push(
        <blockquote
          key={key++}
          className="my-3 border-l-2 border-primary/50 pl-3 text-muted-foreground"
        >
          {renderInline(line.replace(/^>\s?/, ""), `q${key}`)}
        </blockquote>
      );
      i++;
      continue;
    }

    const task = line.match(/^[-*]\s\[( |x|X)\]\s(.*)$/);
    if (task) {
      out.push(
        <div key={key++} className="my-1 flex items-start gap-2">
          <span
            className={cn(
              "mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
              task[1] !== " "
                ? "border-primary bg-primary text-white"
                : "border-border"
            )}
          >
            {task[1] !== " " && <Check className="h-3 w-3" />}
          </span>
          <span className={task[1] !== " " ? "line-through opacity-60" : ""}>
            {renderInline(task[2] ?? "", `t${key}`)}
          </span>
        </div>
      );
      i++;
      continue;
    }

    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^[-*]\s/, ""));
        i++;
      }
      out.push(
        <ul key={key++} className="my-2 list-disc space-y-1 pl-5">
          {items.map((it, j) => (
            <li key={j}>{renderInline(it, `ul${key}-${j}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\d+\.\s/, ""));
        i++;
      }
      out.push(
        <ol key={key++} className="my-2 list-decimal space-y-1 pl-5">
          {items.map((it, j) => (
            <li key={j}>{renderInline(it, `ol${key}-${j}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (/^[-*_]{3,}\s*$/.test(line)) {
      out.push(<hr key={key++} className="my-6 border-border" />);
      i++;
      continue;
    }

    // consecutive plain lines = one paragraph, single newlines render as <br/>
    const buf: string[] = [line];
    while (i + 1 < lines.length) {
      const nxt = lines[i + 1] ?? "";
      if (nxt.trim() === "" || isBlockStart(nxt)) break;
      buf.push(nxt);
      i++;
    }
    out.push(
      <p key={key++} className="my-2">
        {buf.map((b, j) => (
          <span key={j}>
            {j > 0 && <br />}
            {renderInline(b, `p${key}-${j}`)}
          </span>
        ))}
      </p>
    );
    i++;
  }

  return (
    <div className="text-[17px] leading-[1.75] text-foreground">
      {out.length ? out : <p className="text-muted-foreground/50">Nothing to preview.</p>}
    </div>
  );
}

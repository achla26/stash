"use client";

import { useState, useRef } from "react";
import { X, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxTags?: number;
  maxLength?: number;
}

export function TagInput({
  tags,
  onChange,
  placeholder = "Add tag…",
  className,
  disabled = false,
  maxTags = 10,
  maxLength = 30,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(tag: string) {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed) return;
    if (trimmed.length > maxLength) return;
    if (tags.includes(trimmed)) return;
    if (tags.length >= maxTags) return;
    onChange([...tags, trimmed]);
    setInputValue("");
  }

  function removeTag(tagToRemove: string) {
    onChange(tags.filter((t) => t !== tagToRemove));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    }
    if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]!);
    }
  }

  const isAtMax = tags.length >= maxTags;

  return (
    <div
      onClick={() => !disabled && inputRef.current?.focus()}
      className={cn(
        "flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-2 text-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      {/* Tag icon when empty */}
      {tags.length === 0 && !inputValue && (
        <Tag className="ml-0.5 h-4 w-4 shrink-0 text-muted-foreground/70" />
      )}

      {/* Tags */}
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-foreground"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              aria-label={`Remove tag ${tag}`}
              className="-mr-1 ml-0.5 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}

      {/* Input */}
      {!disabled && !isAtMax && (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue) addTag(inputValue);
          }}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="min-w-[80px] flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      )}

      {/* Max tags indicator */}
      {isAtMax && (
        <span className="text-[11px] text-muted-foreground">
          Max {maxTags}
        </span>
      )}
    </div>
  );
}
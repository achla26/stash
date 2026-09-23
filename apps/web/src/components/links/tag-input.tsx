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
  placeholder = "Add tag...",
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
        "flex min-h-[44px] flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm transition-all",
        "focus-within:border-primary focus-within:ring-2 focus-within:ring-ring",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      {/* Tag icon */}
      {tags.length === 0 && (
        <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}

      {/* Tags */}
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-accent px-2.5 py-1 text-xs font-medium text-foreground"
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
              className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
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
          onBlur={() => { if (inputValue) addTag(inputValue); }}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="min-w-[96px] flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      )}

      {/* Max tags indicator */}
      {isAtMax && (
        <span className="text-xs text-muted-foreground">
          Max {maxTags} tags
        </span>
      )}
    </div>
  );
}
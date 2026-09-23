import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  id?: string;
  name?: string;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: LucideIcon;
  children?: React.ReactNode;
  error?: string;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
}

export default function FormField({
  id,
  name,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  icon: Icon,
  children,
  error,
  required,
  optional,
  disabled,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label
        className="flex items-center gap-2 text-sm font-medium"
        style={{ color: "var(--foreground)" }}
      >
        {label}
        {optional && (
          <span className="text-xs font-normal text-muted-foreground">
            (optional)
          </span>
        )}
        {required && <span className="text-destructive">*</span>}
      </label>

      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors focus-within:border-primary",
          error && "border-destructive"
        )}
        style={{
          backgroundColor: "var(--input)",
          borderColor: error ? "var(--destructive)" : "var(--border)",
        }}
      >
        <Icon
          className="h-5 w-5"
          style={{ color: "var(--muted-foreground)" }}
        />

        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className="flex-1 bg-transparent text-sm outline-none disabled:opacity-60"
          style={{ color: "var(--foreground)" }}
        />

        {children}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import FormField from "./form-field";

interface PasswordFieldProps {
  value: string;
  id?:string;
  name?:string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function PasswordField({ value, onChange, onBlur, error, name, id }: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FormField
      id={id ?? "password"}
      name={name}
      label="Password"
      type={showPassword ? "text" : "password"}
      placeholder="Enter your password"
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={error}
      icon={Lock}
    >
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="p-1 rounded transition-colors hover:bg-white/10"
        style={{ color: "var(--muted-foreground)" }}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
      </button>
    </FormField>
  );
}
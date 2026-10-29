"use client";

import { Mail, User } from "lucide-react";
import FormField from "../ui/form-field";
import PasswordField from "../ui/password-field";
import { signupSchema, type SignupInput } from "@repo/contracts/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSignup } from "@/hooks/use-signup";
import { Controller, useForm } from "react-hook-form";

export default function RegisterForm() {
  const signupMutation = useSignup();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: SignupInput) => {
    signupMutation.mutate(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <FormField
            id="name"
            label="Full Name"
            type="text"
            placeholder="John Doe"
            icon={User}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            error={errors.name?.message}
          />
        )}
      />

      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <FormField
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            error={errors.email?.message}
          />
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <PasswordField
            id="password"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            error={errors.password?.message}
          />
        )}
      />

      {signupMutation.isError && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {signupMutation.error instanceof Error
            ? signupMutation.error.message
            : "Signup failed"}
        </p>
      )}

      <button
        type="submit"
        disabled={signupMutation.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        {signupMutation.isPending ? "Creating account…" : "Create Account"}
      </button>
    </form>
  );
}
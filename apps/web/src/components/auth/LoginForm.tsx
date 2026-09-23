"use client";

import { ArrowRight, Mail } from "lucide-react";
import FormField from "../ui/form-field";
import PasswordField from "../ui/password-field";
import { Button } from "../ui/button";
import { loginSchema, type LoginInput } from "@repo/contracts/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@/hooks/use-login";
import { Controller, useForm } from "react-hook-form";

export default function LoginForm() {
  const loginMutation = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: LoginInput) => {
    loginMutation.mutate(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

      {loginMutation.isError && (
        <p className="text-sm text-destructive">
          {loginMutation.error instanceof Error
            ? loginMutation.error.message
            : "Login failed"}
        </p>
      )}

      <Button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? "Signing in..." : "Sign in"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
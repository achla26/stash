"use client";
import { useState } from "react";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@repo/contracts/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@/hooks/use-login";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GoogleButton from "./GoogleButton";

export default function LoginForm() {
  const login = useLogin();
  const [show, setShow] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  return (
    <form
      onSubmit={handleSubmit((values) => login.mutate(values))}
      className="w-full"
      noValidate
    >
      <div className="mb-4">
        <label className="mb-1.5 block text-[13px] font-bold" htmlFor="email">
          Email
        </label>
        <Input
          className="h-auto bg-card px-3 py-2.5"
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="mt-1.5 text-[12.5px] text-destructive" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>
      <div className="mb-4">
        <label
          className="mb-1.5 block text-[13px] font-bold"
          htmlFor="password"
        >
          Password
        </label>
        <div className="relative">
          <Input
            className="h-auto bg-card px-3 py-2.5 pr-[76px]"
            id="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Your password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <button
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-[9px] py-[7px] text-xs font-bold text-muted-foreground"
            type="button"
            onClick={() => setShow(!show)}
            aria-pressed={show}
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1.5 text-[12.5px] text-destructive" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>
      <div className="mb-3.5 -mt-1 text-right text-[12.5px] font-semibold text-primary">
        <Link href="/forgot-password">Forgot password?</Link>
      </div>
      {login.isError && (
        <p role="alert" className="mt-1.5 text-[12.5px] text-destructive">
          {login.error instanceof Error ? login.error.message : "Login failed"}
        </p>
      )}
      <Button
        type="submit"
        disabled={login.isPending}
        className="min-h-[42px] w-full"
      >
        {login.isPending ? "Signing in…" : "Sign in"}
      </Button>
      <GoogleButton />
    </form>
  );
}

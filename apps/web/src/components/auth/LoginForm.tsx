"use client";
import { useState } from "react";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@repo/contracts/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@/hooks/use-login";
import GoogleButton from "./GoogleButton";
import { useForm } from "react-hook-form";
export default function LoginForm() {
  const login = useLogin(); const [show, setShow] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  return <form onSubmit={handleSubmit(values => login.mutate(values))} className="w-full" noValidate>
    <div className="mb-4 [&_label]:mb-1.5 [&_label]:block [&_label]:text-[13px] [&_label]:font-bold [&_input]:block [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-input [&_input]:bg-card [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-sm [&_input]:text-foreground [&_input[aria-invalid=true]]:border-destructive [&_p]:mt-1.5 [&_p]:text-[12.5px] [&_p]:text-destructive"><label htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} {...register("email")} />{errors.email && <p role="alert">{errors.email.message}</p>}</div>
    <div className="mb-4 [&_label]:mb-1.5 [&_label]:block [&_label]:text-[13px] [&_label]:font-bold [&_input]:block [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-input [&_input]:bg-card [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-sm [&_input]:text-foreground [&_input[aria-invalid=true]]:border-destructive [&_p]:mt-1.5 [&_p]:text-[12.5px] [&_p]:text-destructive"><label htmlFor="password">Password</label><div className="relative [&_input]:pr-[76px] [&_button]:absolute [&_button]:right-1.5 [&_button]:top-1/2 [&_button]:-translate-y-1/2 [&_button]:px-[9px] [&_button]:py-[7px] [&_button]:text-xs [&_button]:font-bold [&_button]:text-muted-foreground"><input id="password" type={show ? "text" : "password"} autoComplete="current-password" placeholder="Your password" aria-invalid={!!errors.password} {...register("password")} /><button type="button" onClick={() => setShow(!show)} aria-pressed={show}>{show ? "Hide" : "Show"}</button></div>{errors.password && <p role="alert">{errors.password.message}</p>}</div>
    <div className="mb-3.5 -mt-1 text-right text-[12.5px] font-semibold text-primary"><Link href="/forgot-password">Forgot password?</Link></div>
    {login.isError && <p role="alert" className="mt-1.5 text-[12.5px] text-destructive">{login.error instanceof Error ? login.error.message : "Login failed"}</p>}
    <button type="submit" disabled={login.isPending} className="min-h-[42px] w-full rounded-lg bg-primary px-[18px] py-[11px] text-sm font-bold text-primary-foreground disabled:opacity-60">{login.isPending ? "Signing in…" : "Sign in"}</button><GoogleButton />
  </form>;
}

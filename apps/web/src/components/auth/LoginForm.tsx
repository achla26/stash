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
  return <form onSubmit={handleSubmit(values => login.mutate(values))} className="proto-auth-form" noValidate>
    <div className="proto-auth-field"><label htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} {...register("email")} />{errors.email && <p role="alert">{errors.email.message}</p>}</div>
    <div className="proto-auth-field"><label htmlFor="password">Password</label><div className="proto-auth-password"><input id="password" type={show ? "text" : "password"} autoComplete="current-password" placeholder="Your password" aria-invalid={!!errors.password} {...register("password")} /><button type="button" onClick={() => setShow(!show)} aria-pressed={show}>{show ? "Hide" : "Show"}</button></div>{errors.password && <p role="alert">{errors.password.message}</p>}</div>
    <div className="proto-auth-forgot"><Link href="/forgot-password">Forgot password?</Link></div>
    {login.isError && <p role="alert" className="proto-auth-error">{login.error instanceof Error ? login.error.message : "Login failed"}</p>}
    <button type="submit" disabled={login.isPending} className="proto-auth-submit">{login.isPending ? "Signing in…" : "Sign in"}</button><GoogleButton />
  </form>;
}

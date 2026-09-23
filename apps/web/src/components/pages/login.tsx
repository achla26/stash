"use client"
import AuthFooter from "@/components/auth/AuthFooter";
import AuthFormWrapper from "../auth/AuthFormWrapper"; 
import LoginForm from "../auth/LoginForm";

export default function LoginPage() {
  return (
    <>
      <AuthFormWrapper
        title="Welcome back"
        subtitle="Sign in to continue to your dashboard"
         isLogin={true}
      > 
        <LoginForm />
        <AuthFooter />
      </AuthFormWrapper> 
    </>
  );
}
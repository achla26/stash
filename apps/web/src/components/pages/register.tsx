"use client"
import AuthFooter from "@/components/auth/AuthFooter";
import AuthFormWrapper from "../auth/AuthFormWrapper"; 
import RegisterForm from "../auth/RegisterForm";

export default function LoginPage() {
  return (
    <>
      <AuthFormWrapper
        title="Welcome back"
        subtitle="Sign in to continue to your dashboard"
        isLogin={false}
      >
        <RegisterForm />
        <AuthFooter />
      </AuthFormWrapper> 
    </>
  );
}
"use client"
import AuthFormWrapper from "../auth/AuthFormWrapper"; 
import LoginForm from "../auth/LoginForm";

export default function LoginPage() {
  return (
    <>
      <AuthFormWrapper
        title="Welcome back"
        subtitle="Sign in to open your stash."
         isLogin={true}
      > 
        <LoginForm />

      </AuthFormWrapper> 
    </>
  );
}
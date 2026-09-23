"use client";

import AuthFooter from "@/components/auth/AuthFooter";
import AuthFormWrapper from "../auth/AuthFormWrapper";
import RegisterForm from "../auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthFormWrapper
      title="Create your account"
      subtitle="Start stashing your notes, links and ideas"
      isLogin={false}
    >
      <RegisterForm />
      <AuthFooter />
    </AuthFormWrapper>
  );
}
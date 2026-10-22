"use client";
import AuthFormWrapper from "../auth/AuthFormWrapper";
import ForgotPasswordForm from "../auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthFormWrapper
      title="Forgot password"
      subtitle="We'll email you a secure link to set a new one"
      isLogin={true}
    >
      <ForgotPasswordForm />
    </AuthFormWrapper>
  );
}

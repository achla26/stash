"use client";
import AuthFormWrapper from "../auth/AuthFormWrapper";
import ResetPasswordForm from "../auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <AuthFormWrapper
      title="Set a new password"
      subtitle="Choose something strong — at least 6 characters"
      isLogin={true}
    >
      <ResetPasswordForm />
    </AuthFormWrapper>
  );
}

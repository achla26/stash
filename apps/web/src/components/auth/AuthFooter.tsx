export default function AuthFooter() {
  return (
    <p
      className="mt-8 text-xs text-center max-w-sm relative z-10"
      style={{ color: "var(--muted-foreground)" }}
    >
      By continuing, you agree to our{" "}
      <button
        className="hover:underline"
        style={{ color: "var(--primary)" }}
      >
        Terms of Service
      </button>{" "}
      and{" "}
      <button
        className="hover:underline"
        style={{ color: "var(--primary)" }}
      >
        Privacy Policy
      </button>
    </p>
  );
}
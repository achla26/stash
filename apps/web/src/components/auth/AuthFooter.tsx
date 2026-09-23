export default function AuthFooter() {
  return (
    <p className="relative z-10 mt-8 max-w-sm text-center text-xs text-muted-foreground">
      By continuing, you agree to our{" "}
      <button
        type="button"
        className="text-primary transition-opacity hover:underline hover:opacity-80"
      >
        Terms of Service
      </button>{" "}
      and{" "}
      <button
        type="button"
        className="text-primary transition-opacity hover:underline hover:opacity-80"
      >
        Privacy Policy
      </button>
    </p>
  );
}
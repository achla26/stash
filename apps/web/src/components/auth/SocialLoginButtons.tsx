import { Github, Chrome } from "lucide-react";

interface SocialButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

function SocialButton({ icon, label, onClick }: SocialButtonProps) {
  return (

    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors hover:bg-white/5"
      style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
    >
      {icon}
      {label}
    </button>
  );
}

export default function SocialLoginButtons() {
  const handleGoogle = () => console.log("Google login");
  const handleGithub = () => console.log("GitHub login");

  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <SocialButton
          icon={<Chrome className="w-4 h-4" />}
          label="Google"
          onClick={handleGoogle}
        />
        <SocialButton
          icon={<Github className="w-4 h-4" />}
          label="GitHub"
          onClick={handleGithub}
        />
      </div>
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>or continue with email</span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
      </div>
    </>
  );
}
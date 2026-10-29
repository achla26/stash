import Link from "next/link";
import { Folder, LockKeyhole, Search, ShieldCheck, Zap } from "lucide-react";

interface AuthFormWrapperProps { title: string; subtitle: string; isLogin: boolean; children: React.ReactNode }
export default function AuthFormWrapper({ title, subtitle, isLogin, children }: AuthFormWrapperProps) {
  return <div className="proto-auth">
    <aside className="proto-auth-art"><p className="proto-auth-quote">Stash is a <b>sharp little tool</b> for everything you learn — capture it once, find it instantly, on every device.</p><div className="proto-auth-features"><div><span><Zap size={17}/></span>Save useful pages, notes and ideas in one place</div><div><span><Search size={17}/></span>Find your saved items when you need them</div><div><span><Folder size={17}/></span>Collections that organise the way you think</div><div><span><LockKeyhole size={17}/></span>Keep your learning space your own</div></div><p className="proto-auth-proof"><ShieldCheck size={16}/> Free to get started · No card required</p></aside>
    <main className="proto-auth-panel"><div className="proto-auth-card"><Link href="/" className="proto-auth-logo"><span className="proto-auth-mark"><svg viewBox="0 0 32 32" width="26" height="26" fill="currentColor" aria-hidden="true"><rect x="3" y="5" width="20" height="5" rx="2.5"/><rect x="7" y="13" width="20" height="5" rx="2.5" opacity=".8"/><rect x="11" y="21" width="16" height="5" rx="2.5" opacity=".6"/></svg></span><span><strong>Stash</strong><small>EVERYTHING YOU LEARN</small></span></Link><h1>{title}</h1><p className="proto-auth-sub">{subtitle}</p>{children}<p className="proto-auth-switch">{isLogin ? "New here? " : "Already have an account? "}<Link href={isLogin ? "/signup" : "/login"}>{isLogin ? "Create your stash — it’s free" : "Sign in"}</Link></p></div></main>
  </div>;
}

import { useAuthState } from "@/hooks/use-auth-state";
import { Bell } from "lucide-react";

export function Topbar() {
  const { user } = useAuthState();

  return (
    <header className="h-20 bg-background/80 backdrop-blur-lg border-b border-border sticky top-0 z-30 flex items-center justify-between px-8">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">
          Welcome back, {user?.name.split(' ')[0]} 👋
        </h2>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border border-background"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-6 border-l border-border">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground leading-none">{user?.name}</p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">{user?.role}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-inner">
            {user?.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}

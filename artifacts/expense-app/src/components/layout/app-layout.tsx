import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { useGetMe } from "@workspace/api-client-react";
import { useAuthState } from "@/hooks/use-auth-state";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { setUser, logout, isAuthenticated } = useAuthState();
  
  const { data: user, isLoading, error } = useGetMe({
    query: {
      retry: false,
      enabled: isAuthenticated
    }
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    } else if (error) {
      logout();
    } else if (user) {
      setUser(user);
    }
  }, [user, error, isAuthenticated, setLocation, setUser, logout]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex-1 ml-72 flex flex-col h-screen overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-8 pb-24">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

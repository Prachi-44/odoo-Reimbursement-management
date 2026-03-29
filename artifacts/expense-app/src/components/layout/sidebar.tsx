import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Receipt, 
  ClipboardCheck, 
  Users, 
  Settings, 
  Workflow,
  LogOut
} from "lucide-react";
import { useAuthState } from "@/hooks/use-auth-state";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuthState();

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager" || isAdmin;

  const routes = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "My Expenses", href: "/expenses", icon: Receipt },
    ...(isManager ? [{ name: "Approvals", href: "/approvals", icon: ClipboardCheck }] : []),
  ];

  const adminRoutes = [
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Workflows", href: "/admin/rules", icon: Workflow },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const NavItem = ({ route }: { route: any }) => {
    const isActive = location === route.href || (route.href !== "/" && location.startsWith(route.href));
    
    return (
      <Link 
        href={route.href}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
          isActive 
            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
      >
        <route.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
        <span className="font-medium text-sm">{route.name}</span>
      </Link>
    );
  };

  return (
    <div className="w-72 bg-card border-r border-border h-screen flex flex-col fixed left-0 top-0 z-40">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-6 h-6 object-contain" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg text-foreground leading-tight">NovaExpense</h1>
          <p className="text-xs text-muted-foreground truncate max-w-[150px]">{user?.company.name}</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
        <div className="space-y-2">
          <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Main Menu</p>
          {routes.map(route => <NavItem key={route.href} route={route} />)}
        </div>

        {isAdmin && (
          <div className="space-y-2">
            <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Administration</p>
            {adminRoutes.map(route => <NavItem key={route.href} route={route} />)}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border mt-auto">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
}

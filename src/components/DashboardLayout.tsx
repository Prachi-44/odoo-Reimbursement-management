import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Receipt, PlusCircle, Settings, FileText, LogOut, User, Shield, Briefcase, Users
} from 'lucide-react';

const roleIcon = { admin: Shield, manager: Briefcase, employee: Users };

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'employee'] },
  { to: '/expenses', label: 'Expenses', icon: Receipt, roles: ['admin', 'manager', 'employee'] },
  { to: '/expenses/new', label: 'New Expense', icon: PlusCircle, roles: ['employee'] },
  { to: '/admin/settings', label: 'Workflow Config', icon: Settings, roles: ['admin'] },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileText, roles: ['admin'] },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const RoleIcon = roleIcon[user.role];
  const filtered = navItems.filter(n => n.roles.includes(user.role));

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -260 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-64 shrink-0 flex flex-col border-r border-sidebar-border bg-sidebar"
      >
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="font-heading text-xl font-bold gradient-text">NovaExpense</h1>
          <p className="text-xs text-sidebar-foreground/60 mt-1">Smart Reimbursements</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filtered.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
              <div className="flex items-center gap-1">
                <RoleIcon className="h-3 w-3 text-primary" />
                <span className="text-xs text-sidebar-foreground/60 capitalize">{user.role}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 lg:p-8 max-w-7xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Company, AuditLog } from './types';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  users: User[];
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string, companyName: string, country: string, currency: string) => boolean;
  logout: () => void;
  addUser: (user: User, password: string) => void;
  addAuditLog: (action: string, resource: string, resourceId?: string, details?: string) => void;
  auditLogs: AuditLog[];
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_COMPANY: Company = {
  id: 'c1',
  name: 'NovaExpense Demo Corp',
  country: 'United States',
  currency: 'USD',
  currencySymbol: '$',
};

const DEMO_USERS: { user: User; password: string }[] = [
  { user: { id: 'u1', email: 'admin@expenseapp.com', name: 'Alex Admin', role: 'admin', companyId: 'c1' }, password: 'Admin@123' },
  { user: { id: 'u2', email: 'pm@expenseapp.com', name: 'Maya Manager', role: 'manager', companyId: 'c1' }, password: 'Manager@123' },
  { user: { id: 'u3', email: 'employee@expenseapp.com', name: 'Emma Employee', role: 'employee', companyId: 'c1' }, password: 'Employee@123' },
];

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<{ user: User; password: string }[]>(() =>
    loadFromStorage('nova_users', DEMO_USERS)
  );
  const [companies, setCompanies] = useState<Company[]>(() =>
    loadFromStorage('nova_companies', [DEMO_COMPANY])
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(() =>
    loadFromStorage('nova_current_user', null)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    loadFromStorage('nova_audit_logs', [])
  );

  const currentUser = users.find(u => u.user.id === currentUserId)?.user ?? null;
  const company = currentUser ? companies.find(c => c.id === currentUser.companyId) ?? null : null;

  useEffect(() => { localStorage.setItem('nova_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('nova_companies', JSON.stringify(companies)); }, [companies]);
  useEffect(() => { localStorage.setItem('nova_current_user', JSON.stringify(currentUserId)); }, [currentUserId]);
  useEffect(() => { localStorage.setItem('nova_audit_logs', JSON.stringify(auditLogs)); }, [auditLogs]);

  const addAuditLog = useCallback((action: string, resource: string, resourceId?: string, details?: string) => {
    if (!currentUser) return;
    const log: AuditLog = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      resource,
      resourceId,
      timestamp: new Date().toISOString(),
      details,
    };
    setAuditLogs(prev => [log, ...prev]);
  }, [currentUser]);

  const login = (email: string, password: string): boolean => {
    const found = users.find(u => u.user.email === email && u.password === password);
    if (found) {
      setCurrentUserId(found.user.id);
      return true;
    }
    return false;
  };

  const signup = (name: string, email: string, password: string, companyName: string, country: string, currency: string): boolean => {
    if (users.some(u => u.user.email === email)) return false;
    const companyId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const newCompany: Company = { id: companyId, name: companyName, country, currency, currencySymbol: currency };
    const newUser: User = { id: userId, email, name, role: 'admin', companyId };
    setCompanies(prev => [...prev, newCompany]);
    setUsers(prev => [...prev, { user: newUser, password }]);
    setCurrentUserId(userId);
    return true;
  };

  const logout = () => setCurrentUserId(null);

  const addUser = (user: User, password: string) => {
    setUsers(prev => [...prev, { user, password }]);
  };

  return (
    <AuthContext.Provider value={{
      user: currentUser,
      company,
      users: users.map(u => u.user),
      login, signup, logout, addUser, addAuditLog, auditLogs,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

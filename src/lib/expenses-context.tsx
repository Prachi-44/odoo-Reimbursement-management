import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Expense, Approval, ApprovalStep, ApprovalRule } from './types';

interface ExpensesContextType {
  expenses: Expense[];
  approvals: Approval[];
  workflowSteps: ApprovalStep[];
  approvalRules: ApprovalRule[];
  addExpense: (expense: Expense) => void;
  updateExpenseStatus: (id: string, status: Expense['status']) => void;
  addApproval: (approval: Approval) => void;
  updateApproval: (expenseId: string, stepOrder: number, decision: 'approved' | 'rejected', comment: string, approverId: string, approverName: string) => void;
  setWorkflowSteps: (steps: ApprovalStep[]) => void;
  setApprovalRules: (rules: ApprovalRule[]) => void;
}

const ExpensesContext = createContext<ExpensesContextType | null>(null);

const DEFAULT_STEPS: ApprovalStep[] = [
  { id: 's1', companyId: 'c1', order: 1, role: 'manager', label: 'Manager Review' },
  { id: 's2', companyId: 'c1', order: 2, role: 'admin', label: 'Finance Approval' },
];

const SEED_EXPENSES: Expense[] = [
  { id: 'e1', userId: 'u3', userName: 'Emma Employee', amount: 125.50, currency: 'USD', convertedAmount: 125.50, companyCurrency: 'USD', category: 'Meals', description: 'Team lunch with client', merchant: 'The Grand Bistro', date: '2026-03-25', status: 'pending', createdAt: '2026-03-25T10:00:00Z' },
  { id: 'e2', userId: 'u3', userName: 'Emma Employee', amount: 89.99, currency: 'USD', convertedAmount: 89.99, companyCurrency: 'USD', category: 'Software', description: 'Monthly Figma subscription', merchant: 'Figma Inc', date: '2026-03-20', status: 'approved', createdAt: '2026-03-20T09:00:00Z' },
  { id: 'e3', userId: 'u3', userName: 'Emma Employee', amount: 450.00, currency: 'EUR', convertedAmount: 490.50, companyCurrency: 'USD', category: 'Travel', description: 'Flight to Berlin conference', merchant: 'Lufthansa', date: '2026-03-15', status: 'submitted', createdAt: '2026-03-15T14:00:00Z' },
  { id: 'e4', userId: 'u3', userName: 'Emma Employee', amount: 32.00, currency: 'USD', convertedAmount: 32.00, companyCurrency: 'USD', category: 'Transportation', description: 'Uber to airport', merchant: 'Uber', date: '2026-03-14', status: 'rejected', createdAt: '2026-03-14T06:00:00Z' },
];

const SEED_APPROVALS: Approval[] = [
  { id: 'a1', expenseId: 'e1', stepOrder: 1, approverId: 'u2', approverName: 'Maya Manager', approverRole: 'manager', stepLabel: 'Manager Review', decision: 'approved', comment: 'Looks good, client lunch is justified.', timestamp: '2026-03-26T09:00:00Z' },
  { id: 'a2', expenseId: 'e1', stepOrder: 2, approverId: '', approverName: '', approverRole: 'admin', stepLabel: 'Finance Approval', decision: 'pending' },
  { id: 'a3', expenseId: 'e2', stepOrder: 1, approverId: 'u2', approverName: 'Maya Manager', approverRole: 'manager', stepLabel: 'Manager Review', decision: 'approved', comment: 'Approved - necessary tool.', timestamp: '2026-03-21T10:00:00Z' },
  { id: 'a4', expenseId: 'e2', stepOrder: 2, approverId: 'u1', approverName: 'Alex Admin', approverRole: 'admin', stepLabel: 'Finance Approval', decision: 'approved', comment: 'Within budget.', timestamp: '2026-03-22T11:00:00Z' },
  { id: 'a5', expenseId: 'e4', stepOrder: 1, approverId: 'u2', approverName: 'Maya Manager', approverRole: 'manager', stepLabel: 'Manager Review', decision: 'rejected', comment: 'Please use corporate transport.', timestamp: '2026-03-15T08:00:00Z' },
];

function load<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : fallback;
  } catch { return fallback; }
}

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>(() => load('nova_expenses', SEED_EXPENSES));
  const [approvals, setApprovals] = useState<Approval[]>(() => load('nova_approvals', SEED_APPROVALS));
  const [workflowSteps, setWorkflowStepsState] = useState<ApprovalStep[]>(() => load('nova_steps', DEFAULT_STEPS));
  const [approvalRules, setApprovalRulesState] = useState<ApprovalRule[]>(() => load('nova_rules', []));

  useEffect(() => { localStorage.setItem('nova_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('nova_approvals', JSON.stringify(approvals)); }, [approvals]);
  useEffect(() => { localStorage.setItem('nova_steps', JSON.stringify(workflowSteps)); }, [workflowSteps]);
  useEffect(() => { localStorage.setItem('nova_rules', JSON.stringify(approvalRules)); }, [approvalRules]);

  const addExpense = (expense: Expense) => setExpenses(prev => [expense, ...prev]);
  const updateExpenseStatus = (id: string, status: Expense['status']) =>
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status } : e));

  const addApproval = (approval: Approval) => setApprovals(prev => [...prev, approval]);

  const updateApproval = (expenseId: string, stepOrder: number, decision: 'approved' | 'rejected', comment: string, approverId: string, approverName: string) => {
    setApprovals(prev => prev.map(a =>
      a.expenseId === expenseId && a.stepOrder === stepOrder
        ? { ...a, decision, comment, approverId, approverName, timestamp: new Date().toISOString() }
        : a
    ));
    if (decision === 'rejected') {
      updateExpenseStatus(expenseId, 'rejected');
    } else {
      const expenseApprovals = approvals.filter(a => a.expenseId === expenseId);
      const allApproved = expenseApprovals.every(a =>
        a.stepOrder === stepOrder ? true : a.decision === 'approved'
      );
      if (allApproved) updateExpenseStatus(expenseId, 'approved');
    }
  };

  const setWorkflowSteps = (steps: ApprovalStep[]) => setWorkflowStepsState(steps);
  const setApprovalRules = (rules: ApprovalRule[]) => setApprovalRulesState(rules);

  return (
    <ExpensesContext.Provider value={{
      expenses, approvals, workflowSteps, approvalRules,
      addExpense, updateExpenseStatus, addApproval, updateApproval,
      setWorkflowSteps, setApprovalRules,
    }}>
      {children}
    </ExpensesContext.Provider>
  );
}

export function useExpenses() {
  const ctx = useContext(ExpensesContext);
  if (!ctx) throw new Error('useExpenses must be used within ExpensesProvider');
  return ctx;
}

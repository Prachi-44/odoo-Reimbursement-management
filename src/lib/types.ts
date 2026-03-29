export type UserRole = 'admin' | 'manager' | 'employee';
export type ExpenseStatus = 'draft' | 'submitted' | 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  avatar?: string;
}

export interface Company {
  id: string;
  name: string;
  country: string;
  currency: string;
  currencySymbol: string;
}

export interface Expense {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  currency: string;
  convertedAmount: number;
  companyCurrency: string;
  category: string;
  description: string;
  merchant: string;
  date: string;
  receiptUrl?: string;
  status: ExpenseStatus;
  createdAt: string;
}

export interface ApprovalStep {
  id: string;
  companyId: string;
  order: number;
  role: string;
  label: string;
}

export interface Approval {
  id: string;
  expenseId: string;
  stepOrder: number;
  approverId: string;
  approverName: string;
  approverRole: string;
  stepLabel: string;
  decision: 'approved' | 'rejected' | 'pending';
  comment?: string;
  timestamp?: string;
}

export interface ApprovalRule {
  id: string;
  companyId: string;
  type: 'percentage' | 'specific_approver' | 'hybrid';
  percentageThreshold?: number;
  specificApproverId?: string;
  specificApproverName?: string;
  description: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: string;
  details?: string;
}

export const EXPENSE_CATEGORIES = [
  'Travel', 'Meals', 'Office Supplies', 'Software', 'Equipment',
  'Transportation', 'Accommodation', 'Entertainment', 'Training', 'Other'
];

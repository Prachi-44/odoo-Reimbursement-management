import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useExpenses } from '@/lib/expenses-context';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { ApprovalTimeline } from '@/components/ApprovalTimeline';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { ArrowLeft, Receipt, Calendar, Tag, Building2, DollarSign } from 'lucide-react';

export default function ExpenseDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, addAuditLog } = useAuth();
  const { expenses, approvals, updateApproval } = useExpenses();
  const navigate = useNavigate();
  const [comment, setComment] = useState('');

  if (!user) return null;

  const expense = expenses.find(e => e.id === id);
  if (!expense) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Expense not found.</p>
      </DashboardLayout>
    );
  }

  const expenseApprovals = approvals.filter(a => a.expenseId === expense.id);
  const canApprove = user.role !== 'employee' && expenseApprovals.some(
    a => a.decision === 'pending' && a.approverRole === user.role
  );
  const pendingStep = expenseApprovals.find(a => a.decision === 'pending' && a.approverRole === user.role);

  const handleDecision = (decision: 'approved' | 'rejected') => {
    if (!pendingStep) return;
    updateApproval(expense.id, pendingStep.stepOrder, decision, comment.trim().slice(0, 500), user.id, user.name);
    addAuditLog(
      decision === 'approved' ? 'Expense Approved' : 'Expense Rejected',
      'expense', expense.id,
      `${expense.description} - ${comment || 'No comment'}`
    );
    setComment('');
  };

  return (
    <DashboardLayout>
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Expense details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="glass-strong rounded-xl p-6 card-shadow">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-xl font-heading font-bold text-foreground">{expense.description}</h1>
                <p className="text-sm text-muted-foreground mt-1">Submitted by {expense.userName}</p>
              </div>
              <StatusBadge status={expense.status} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { icon: DollarSign, label: 'Amount', value: `${expense.currency} ${expense.amount.toFixed(2)}` },
                { icon: DollarSign, label: 'Converted', value: `${expense.companyCurrency} ${expense.convertedAmount.toFixed(2)}` },
                { icon: Tag, label: 'Category', value: expense.category },
                { icon: Building2, label: 'Merchant', value: expense.merchant || '—' },
                { icon: Calendar, label: 'Date', value: expense.date },
                { icon: Receipt, label: 'Receipt', value: expense.receiptUrl ? 'Attached' : 'None' },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-1.5 mb-1">
                    <item.icon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            {expense.receiptUrl && (
              <div className="mt-4">
                <img src={expense.receiptUrl} alt="Receipt" className="max-h-48 rounded-lg border border-border" />
              </div>
            )}
          </div>

          {/* Approve / Reject */}
          {canApprove && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-strong rounded-xl p-6 card-shadow"
            >
              <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Your Decision</h2>
              <Textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Add a comment (optional)..."
                className="bg-secondary border-border mb-4"
              />
              <div className="flex gap-3">
                <Button onClick={() => handleDecision('approved')} className="flex-1 bg-success hover:bg-success/90 text-success-foreground">
                  Approve
                </Button>
                <Button onClick={() => handleDecision('rejected')} variant="destructive" className="flex-1">
                  Reject
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-strong rounded-xl p-6 card-shadow"
        >
          <h2 className="font-heading text-lg font-semibold text-foreground mb-6">Approval Timeline</h2>
          <ApprovalTimeline
            approvals={expenseApprovals}
            submitterName={expense.userName}
            submittedAt={expense.createdAt}
          />
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

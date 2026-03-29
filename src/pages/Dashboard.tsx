import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { useExpenses } from '@/lib/expenses-context';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { Receipt, Clock, CheckCircle, XCircle, DollarSign, TrendingUp, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' as const },
  }),
};

export default function Dashboard() {
  const { user } = useAuth();
  const { expenses, approvals } = useExpenses();
  const navigate = useNavigate();

  if (!user) return null;

  const myExpenses = user.role === 'employee'
    ? expenses.filter(e => e.userId === user.id)
    : expenses;

  const pending = myExpenses.filter(e => e.status === 'pending' || e.status === 'submitted');
  const approved = myExpenses.filter(e => e.status === 'approved');
  const rejected = myExpenses.filter(e => e.status === 'rejected');
  const totalAmount = approved.reduce((sum, e) => sum + e.convertedAmount, 0);

  const pendingApprovals = user.role !== 'employee'
    ? expenses.filter(e => {
        const expApprovals = approvals.filter(a => a.expenseId === e.id);
        return expApprovals.some(a => a.decision === 'pending' && a.approverRole === user.role);
      })
    : [];

  const stats = [
    { label: 'Total Expenses', value: myExpenses.length, icon: Receipt, color: 'text-primary' },
    { label: 'Pending', value: pending.length, icon: Clock, color: 'text-warning' },
    { label: 'Approved', value: approved.length, icon: CheckCircle, color: 'text-success' },
    { label: 'Total Approved', value: `$${totalAmount.toLocaleString()}`, icon: DollarSign, color: 'text-accent' },
  ];

  if (user.role !== 'employee') {
    stats.push({ label: 'Awaiting Your Review', value: pendingApprovals.length, icon: TrendingUp, color: 'text-primary' });
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Welcome back, {user.name.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here's your expense overview
          </p>
        </div>
        {user.role === 'employee' && (
          <Button onClick={() => navigate('/expenses/new')} className="glow gap-2">
            <PlusCircle className="h-4 w-4" />
            New Expense
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.slice(0, 4).map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="glass-strong rounded-xl p-5 card-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Pending Approvals for Manager/Admin */}
      {pendingApprovals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-strong rounded-xl p-6 card-shadow mb-8"
        >
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4">
            Awaiting Your Review ({pendingApprovals.length})
          </h2>
          <div className="space-y-3">
            {pendingApprovals.slice(0, 5).map(expense => (
              <div
                key={expense.id}
                onClick={() => navigate(`/expenses/${expense.id}`)}
                className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 cursor-pointer transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{expense.description}</p>
                  <p className="text-xs text-muted-foreground">by {expense.userName} · {expense.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">${expense.convertedAmount.toFixed(2)}</p>
                  <StatusBadge status={expense.status} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Expenses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-strong rounded-xl p-6 card-shadow"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Recent Expenses</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/expenses')}>
            View All
          </Button>
        </div>
        {myExpenses.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">No expenses yet</p>
        ) : (
          <div className="space-y-3">
            {myExpenses.slice(0, 5).map(expense => (
              <div
                key={expense.id}
                onClick={() => navigate(`/expenses/${expense.id}`)}
                className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Receipt className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{expense.description}</p>
                    <p className="text-xs text-muted-foreground">{expense.merchant} · {expense.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {expense.currency !== expense.companyCurrency
                      ? `${expense.currency} ${expense.amount} → $${expense.convertedAmount.toFixed(2)}`
                      : `$${expense.amount.toFixed(2)}`
                    }
                  </p>
                  <StatusBadge status={expense.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}

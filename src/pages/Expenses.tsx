import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useExpenses } from '@/lib/expenses-context';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PlusCircle, Filter } from 'lucide-react';
import type { ExpenseStatus } from '@/lib/types';

export default function Expenses() {
  const { user } = useAuth();
  const { expenses } = useExpenses();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | 'all'>('all');

  if (!user) return null;

  const filtered = expenses
    .filter(e => user.role === 'employee' ? e.userId === user.id : true)
    .filter(e => statusFilter === 'all' || e.status === statusFilter)
    .filter(e =>
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.merchant.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase())
    );

  const statuses: (ExpenseStatus | 'all')[] = ['all', 'draft', 'submitted', 'pending', 'approved', 'rejected'];

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-heading font-bold text-foreground">Expenses</h1>
        {user.role === 'employee' && (
          <Button onClick={() => navigate('/expenses/new')} className="glow gap-2">
            <PlusCircle className="h-4 w-4" /> New Expense
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search expenses..."
            className="pl-10 bg-secondary border-border"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-secondary text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Expense list */}
      <div className="glass-strong rounded-xl card-shadow overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-12">No expenses found</p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((expense, i) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/expenses/${expense.id}`)}
                className="flex items-center justify-between p-4 hover:bg-background/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {expense.category.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{expense.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {expense.merchant} · {expense.date}
                      {user.role !== 'employee' && ` · ${expense.userName}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">${expense.convertedAmount.toFixed(2)}</p>
                    {expense.currency !== expense.companyCurrency && (
                      <p className="text-xs text-muted-foreground">{expense.currency} {expense.amount}</p>
                    )}
                  </div>
                  <StatusBadge status={expense.status} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

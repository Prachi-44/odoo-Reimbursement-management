import { useState } from "react";
import { useGetExpenses } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "wouter";
import { Plus, Search, Filter } from "lucide-react";

export default function ExpensesList() {
  const [statusFilter, setStatusFilter] = useState<any>(undefined);
  const { data: expenses, isLoading } = useGetExpenses(statusFilter ? { status: statusFilter } : undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold">My Expenses</h2>
          <p className="text-muted-foreground mt-1">Manage your submitted expense reports.</p>
        </div>
        <Link 
          href="/expenses/new" 
          className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-5 h-5" />
          New Expense
        </Link>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between bg-secondary/20">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search expenses..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <select 
              className="py-2 pl-3 pr-8 rounded-lg bg-background border border-border text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/10"
              value={statusFilter || ""}
              onChange={(e) => setStatusFilter(e.target.value || undefined)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center">Loading...</td></tr>
              ) : expenses?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                        <Receipt className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-lg font-semibold text-foreground">No expenses found</p>
                      <p className="max-w-sm mt-1">You haven't submitted any expenses yet or none match your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                expenses?.map((exp) => (
                  <tr key={exp.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{formatDate(exp.date)}</td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      <Link href={`/expenses/${exp.id}`} className="hover:underline hover:text-primary line-clamp-1 max-w-[300px]">
                        {exp.description}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-secondary px-2.5 py-1 rounded-md text-xs font-medium text-secondary-foreground">{exp.category}</span>
                    </td>
                    <td className="px-6 py-4 font-bold font-display text-right">{formatCurrency(exp.amount, exp.currency)}</td>
                    <td className="px-6 py-4 text-center"><StatusBadge status={exp.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/expenses/${exp.id}`} className="text-primary font-semibold hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Receipt(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17V7"/></svg>
}

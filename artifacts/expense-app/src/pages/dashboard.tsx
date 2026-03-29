import { useGetDashboardStats } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Wallet, Clock, CheckCircle2, XCircle, TrendingUp, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();

  if (isLoading) return <div className="animate-pulse space-y-8">
    <div className="h-32 bg-card rounded-2xl"></div>
    <div className="h-96 bg-card rounded-2xl"></div>
  </div>;

  if (!stats) return null;

  const cards = [
    { title: "Total Spend", value: stats.totalAmount, count: stats.totalExpenses, icon: Wallet, color: "text-primary", bg: "bg-primary/10" },
    { title: "Pending", value: stats.pendingAmount, count: stats.pendingExpenses, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Approved", value: stats.approvedAmount, count: stats.approvedExpenses, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Rejected", value: stats.rejectedExpenses > 0 ? 0 : 0, count: stats.rejectedExpenses, icon: XCircle, color: "text-rose-500", bg: "bg-rose-500/10", hideAmount: true },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold">Overview</h2>
          <p className="text-muted-foreground mt-1">Track and manage your expenses at a glance.</p>
        </div>
        <Link 
          href="/expenses/new" 
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
        >
          <TrendingUp className="w-5 h-5" />
          Submit Expense
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                {!card.hideAmount && <h3 className="text-2xl font-bold font-display mt-2">{formatCurrency(card.value)}</h3>}
                <p className="text-sm text-muted-foreground mt-1">{card.count} expenses</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg} ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-bold text-lg">Recent Expenses</h3>
          <Link href="/expenses" className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.recentExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{formatDate(exp.date)}</td>
                  <td className="px-6 py-4 font-medium text-foreground">
                    <Link href={`/expenses/${exp.id}`} className="hover:underline hover:text-primary">
                      {exp.description}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-secondary px-2.5 py-1 rounded-md text-xs font-medium text-secondary-foreground">{exp.category}</span>
                  </td>
                  <td className="px-6 py-4 font-bold font-display">{formatCurrency(exp.amount, exp.currency)}</td>
                  <td className="px-6 py-4"><StatusBadge status={exp.status} /></td>
                </tr>
              ))}
              {stats.recentExpenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No recent expenses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

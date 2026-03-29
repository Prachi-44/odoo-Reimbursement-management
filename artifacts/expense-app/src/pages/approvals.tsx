import { useGetExpenses } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "wouter";
import { ClipboardCheck } from "lucide-react";

export default function Approvals() {
  // Fetch pending expenses. The backend should ideally filter to only show ones pending THIS user's approval
  const { data: expenses, isLoading } = useGetExpenses({ status: "pending" });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold">Action Required</h2>
        <p className="text-muted-foreground mt-1">Expenses waiting for your review and approval.</p>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Employee</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Description</th>
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
                  <td colSpan={6} className="px-6 py-20 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                        <ClipboardCheck className="w-10 h-10 text-emerald-500" />
                      </div>
                      <p className="text-xl font-display font-bold text-foreground">All caught up!</p>
                      <p className="mt-2">There are no expenses waiting for your approval right now.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                expenses?.map((exp) => (
                  <tr key={exp.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {exp.user.name.charAt(0)}
                        </div>
                        <span className="font-medium text-foreground">{exp.user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-muted-foreground">{formatDate(exp.date)}</td>
                    <td className="px-6 py-5 font-medium text-foreground">
                      <span className="line-clamp-1 max-w-[250px]">{exp.description}</span>
                    </td>
                    <td className="px-6 py-5 font-bold font-display text-right text-lg">{formatCurrency(exp.amount, exp.currency)}</td>
                    <td className="px-6 py-5 text-center"><StatusBadge status={exp.status} /></td>
                    <td className="px-6 py-5 text-right">
                      <Link 
                        href={`/expenses/${exp.id}`} 
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 inline-block"
                      >
                        Review
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

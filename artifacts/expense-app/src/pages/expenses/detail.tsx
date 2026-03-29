import { useRoute } from "wouter";
import { useGetExpense, useApproveExpense, getGetExpenseQueryKey } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuthState } from "@/hooks/use-auth-state";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, X, FileText, Loader2, User as UserIcon } from "lucide-react";

export default function ExpenseDetail() {
  const [, params] = useRoute("/expenses/:id");
  const id = parseInt(params?.id || "0");
  const queryClient = useQueryClient();
  const { user } = useAuthState();
  
  const { data: expense, isLoading } = useGetExpense(id);
  const approveMutation = useApproveExpense();
  
  const [comment, setComment] = useState("");
  const [actionLoading, setActionLoading] = useState<"approved" | "rejected" | null>(null);

  if (isLoading) return <div className="animate-pulse h-96 bg-card rounded-2xl max-w-4xl mx-auto"></div>;
  if (!expense) return <div className="text-center py-20">Expense not found</div>;

  const handleApprove = async (action: "approved" | "rejected") => {
    setActionLoading(action);
    try {
      await approveMutation.mutateAsync({
        id,
        data: { action, comments: comment || undefined }
      });
      queryClient.invalidateQueries({ queryKey: getGetExpenseQueryKey(id) });
      setComment("");
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // Determine if current user can approve (if their approval step is pending)
  const pendingApprovalForMe = expense.approvals.find(
    a => a.approverId === user?.id && a.status === "pending"
  );
  const canApprove = !!pendingApprovalForMe && expense.status === "pending";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold">Expense Report #{expense.id}</h2>
          <p className="text-muted-foreground mt-1">Submitted by {expense.user.name} on {formatDate(expense.createdAt)}</p>
        </div>
        <StatusBadge status={expense.status} className="text-sm px-4 py-1.5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-8">
            <div className="flex justify-between items-start mb-8 pb-6 border-b border-border">
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Amount</p>
                <h3 className="text-4xl font-display font-bold text-foreground">
                  {formatCurrency(expense.amount, expense.currency)}
                </h3>
                {expense.convertedAmount && expense.currency !== user?.company.defaultCurrency && (
                  <p className="text-sm text-muted-foreground mt-1">
                    ≈ {formatCurrency(expense.convertedAmount, user?.company.defaultCurrency)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Category</p>
                <span className="inline-block bg-secondary px-3 py-1 rounded-lg text-sm font-medium">
                  {expense.category}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description / Vendor</p>
                <p className="text-lg font-medium">{expense.description}</p>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Expense Date</p>
                <p className="text-lg font-medium">{formatDate(expense.date)}</p>
              </div>
            </div>
          </div>

          {canApprove && (
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl shadow-sm border border-primary/20 p-8 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-display font-bold mb-4">Your Approval Required</h3>
                <textarea 
                  className="w-full p-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all mb-4 resize-none"
                  placeholder="Add a comment (optional)..."
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleApprove("approved")}
                    disabled={actionLoading !== null}
                    className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    {actionLoading === "approved" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    Approve Expense
                  </button>
                  <button 
                    onClick={() => handleApprove("rejected")}
                    disabled={actionLoading !== null}
                    className="flex-1 py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-semibold shadow-lg shadow-destructive/25 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    {actionLoading === "rejected" ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-8">
            <h3 className="text-lg font-display font-bold mb-6">Approval Timeline</h3>
            <div className="space-y-6">
              <div className="flex gap-4 relative">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 z-10 ring-4 ring-card">
                  <UserIcon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="absolute top-10 bottom-[-24px] left-5 w-[2px] bg-border z-0"></div>
                <div className="pt-2 pb-4">
                  <p className="font-semibold">{expense.user.name} <span className="font-normal text-muted-foreground">submitted expense</span></p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(expense.createdAt)}</p>
                </div>
              </div>

              {expense.approvals.sort((a,b) => a.stepOrder - b.stepOrder).map((app, i) => (
                <div key={app.id} className="flex gap-4 relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ring-4 ring-card ${
                    app.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                    app.status === 'rejected' ? 'bg-rose-100 text-rose-600' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    {app.status === 'approved' ? <Check className="w-5 h-5" /> :
                     app.status === 'rejected' ? <X className="w-5 h-5" /> :
                     <Loader2 className="w-5 h-5 animate-spin" />}
                  </div>
                  {i < expense.approvals.length - 1 && <div className="absolute top-10 bottom-[-24px] left-5 w-[2px] bg-border z-0"></div>}
                  <div className="pt-2 pb-4">
                    <p className="font-semibold">
                      {app.approver.name}
                      <span className="font-normal text-muted-foreground ml-1">
                        {app.status === 'approved' ? 'approved' : app.status === 'rejected' ? 'rejected' : 'is reviewing'}
                      </span>
                    </p>
                    {app.comments && (
                      <div className="mt-3 p-3 bg-secondary/50 rounded-lg border border-border text-sm italic">
                        "{app.comments}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden sticky top-28">
            <div className="p-4 border-b border-border bg-secondary/20 flex justify-between items-center">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" /> Receipt
              </h3>
            </div>
            <div className="p-4">
              {expense.receiptUrl ? (
                <a href={expense.receiptUrl} target="_blank" rel="noreferrer" className="block relative group rounded-xl overflow-hidden border border-border">
                  <img src={expense.receiptUrl} alt="Receipt" className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-medium px-4 py-2 bg-black/50 rounded-lg backdrop-blur-sm">View Full Size</span>
                  </div>
                </a>
              ) : (
                <div className="aspect-[3/4] rounded-xl bg-secondary/50 border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                  <FileText className="w-12 h-12 mb-3 opacity-20" />
                  <p>No receipt attached to this expense.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

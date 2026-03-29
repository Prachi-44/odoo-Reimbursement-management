import { useGetApprovalRules } from "@workspace/api-client-react";
import { Workflow, Settings } from "lucide-react";

export default function ApprovalRules() {
  const { data: rules, isLoading } = useGetApprovalRules();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold">Approval Workflows</h2>
          <p className="text-muted-foreground mt-1">Configure automated routing for expense approvals.</p>
        </div>
        <button className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 opacity-50 cursor-not-allowed" title="Coming soon">
          <Workflow className="w-5 h-5" />
          Create Rule
        </button>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="h-48 bg-card animate-pulse rounded-2xl"></div>
        ) : rules?.length === 0 ? (
          <div className="bg-card rounded-2xl p-12 text-center border border-border/50 border-dashed">
            <Workflow className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-display font-semibold">No rules configured</h3>
            <p className="text-muted-foreground mt-2">Expenses will currently require only manager approval.</p>
          </div>
        ) : (
          rules?.map(rule => (
            <div key={rule.id} className="bg-card rounded-2xl shadow-sm border border-border/50 p-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-display font-bold capitalize">{rule.ruleType} Rule</h3>
                  {rule.isActive ? 
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-xs font-bold uppercase">Active</span> :
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold uppercase">Inactive</span>
                  }
                </div>
                <p className="text-muted-foreground text-sm">
                  {rule.ruleType === 'percentage' ? `Triggers when amount exceeds ${rule.threshold}% of budget.` :
                   rule.ruleType === 'specific' ? `Routes specifically to designated approver.` : 'Hybrid multi-step routing.'}
                </p>
                <div className="flex items-center gap-2 mt-4 text-sm font-medium">
                  <span className="text-muted-foreground">Steps:</span>
                  <div className="flex gap-2">
                    {rule.steps.map((step, i) => (
                      <span key={step.id} className="flex items-center gap-2">
                        <span className="bg-secondary px-2 py-1 rounded-md">{step.approverRole}</span>
                        {i < rule.steps.length - 1 && <span className="text-muted-foreground">→</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

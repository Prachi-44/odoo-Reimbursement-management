import type { ExpenseStatus } from '@/lib/types';

const statusConfig: Record<ExpenseStatus, { label: string; classes: string }> = {
  draft: { label: 'Draft', classes: 'bg-muted/50 text-muted-foreground border-border' },
  submitted: { label: 'Submitted', classes: 'bg-primary/15 text-primary border-primary/30' },
  pending: { label: 'Pending', classes: 'bg-warning/15 text-warning border-warning/30' },
  approved: { label: 'Approved', classes: 'bg-success/15 text-success border-success/30' },
  rejected: { label: 'Rejected', classes: 'bg-destructive/15 text-destructive border-destructive/30' },
};

export function StatusBadge({ status }: { status: ExpenseStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'approved' ? 'bg-success' :
        status === 'rejected' ? 'bg-destructive' :
        status === 'pending' ? 'bg-warning' :
        status === 'submitted' ? 'bg-primary' : 'bg-muted-foreground'
      }`} />
      {config.label}
    </span>
  );
}

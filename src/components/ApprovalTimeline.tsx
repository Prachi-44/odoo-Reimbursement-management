import { motion } from 'framer-motion';
import type { Approval } from '@/lib/types';
import { Check, X, Clock, MessageSquare, User } from 'lucide-react';

interface ApprovalTimelineProps {
  approvals: Approval[];
  submitterName?: string;
  submittedAt?: string;
}

export function ApprovalTimeline({ approvals, submitterName, submittedAt }: ApprovalTimelineProps) {
  const sorted = [...approvals].sort((a, b) => a.stepOrder - b.stepOrder);

  const getIcon = (decision: string) => {
    switch (decision) {
      case 'approved': return <Check className="h-4 w-4" />;
      case 'rejected': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getNodeClasses = (decision: string) => {
    switch (decision) {
      case 'approved': return 'bg-success border-success/50';
      case 'rejected': return 'bg-destructive border-destructive/50';
      default: return 'bg-secondary border-border';
    }
  };

  const getLineClasses = (decision: string) => {
    switch (decision) {
      case 'approved': return 'bg-success/50';
      case 'rejected': return 'bg-destructive/50';
      default: return 'bg-border';
    }
  };

  return (
    <div className="relative pl-8">
      {/* Submission node */}
      {submitterName && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative mb-8"
        >
          <div className="absolute -left-8 top-0 flex flex-col items-center">
            <div className="h-8 w-8 rounded-full bg-primary border-2 border-primary/50 flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            {sorted.length > 0 && <div className="w-0.5 h-full bg-primary/50 mt-1" />}
          </div>
          <div className="glass rounded-lg p-4">
            <p className="font-heading text-sm font-semibold text-foreground">Expense Submitted</p>
            <p className="text-xs text-muted-foreground mt-1">by {submitterName}</p>
            {submittedAt && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Approval nodes */}
      {sorted.map((approval, index) => (
        <motion.div
          key={approval.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: (index + 1) * 0.15 }}
          className="relative mb-8 last:mb-0"
        >
          <div className="absolute -left-8 top-0 flex flex-col items-center">
            <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-primary-foreground ${getNodeClasses(approval.decision)}`}>
              {getIcon(approval.decision)}
            </div>
            {index < sorted.length - 1 && (
              <div className={`w-0.5 flex-1 mt-1 min-h-[2rem] ${getLineClasses(approval.decision)}`} />
            )}
            {approval.decision === 'pending' && (
              <div className="absolute -left-8 top-0 h-8 w-8 rounded-full animate-pulse-ring border-2 border-muted-foreground/30" />
            )}
          </div>

          <div className="glass rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="font-heading text-sm font-semibold text-foreground">{approval.stepLabel}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                approval.decision === 'approved' ? 'bg-success/20 text-success' :
                approval.decision === 'rejected' ? 'bg-destructive/20 text-destructive' :
                'bg-muted text-muted-foreground'
              }`}>
                {approval.decision.charAt(0).toUpperCase() + approval.decision.slice(1)}
              </span>
            </div>
            {approval.approverName && (
              <p className="text-xs text-muted-foreground mt-1">by {approval.approverName} ({approval.approverRole})</p>
            )}
            {approval.comment && (
              <div className="flex items-start gap-1.5 mt-2 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                <p>{approval.comment}</p>
              </div>
            )}
            {approval.timestamp && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                {new Date(approval.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

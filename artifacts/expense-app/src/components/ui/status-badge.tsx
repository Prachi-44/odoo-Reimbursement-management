import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: "pending" | "approved" | "rejected";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = {
    pending: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    approved: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    rejected: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
  };

  const icons = {
    pending: <Clock className="w-3.5 h-3.5 mr-1.5" />,
    approved: <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />,
    rejected: <XCircle className="w-3.5 h-3.5 mr-1.5" />,
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border shadow-sm",
        styles[status],
        className
      )}
    >
      {icons[status]}
      <span className="capitalize">{status}</span>
    </span>
  );
}

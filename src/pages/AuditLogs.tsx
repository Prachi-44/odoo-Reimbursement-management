import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Search, FileText, User, Clock } from 'lucide-react';

export default function AuditLogs() {
  const { user, auditLogs } = useAuth();
  const [search, setSearch] = useState('');

  if (!user || user.role !== 'admin') return null;

  const filtered = auditLogs.filter(log =>
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.userName.toLowerCase().includes(search.toLowerCase()) ||
    log.resource.toLowerCase().includes(search.toLowerCase()) ||
    (log.details?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  return (
    <DashboardLayout>
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-heading font-bold text-foreground">Audit Logs</h1>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search logs..."
          className="pl-10 bg-secondary border-border"
        />
      </div>

      <div className="glass-strong rounded-xl card-shadow overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-12">No audit logs yet</p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="p-4 hover:bg-background/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{log.userName}</span>
                        {' '}
                        <span className="text-muted-foreground">{log.action}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {log.resource}{log.details ? ` — ${log.details}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                    <Clock className="h-3 w-3" />
                    {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

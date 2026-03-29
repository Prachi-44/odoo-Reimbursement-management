import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useExpenses } from '@/lib/expenses-context';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import type { ApprovalStep } from '@/lib/types';
import { Plus, Trash2, GripVertical, Save, Settings } from 'lucide-react';

export default function AdminSettings() {
  const { user, addAuditLog } = useAuth();
  const { workflowSteps, setWorkflowSteps } = useExpenses();

  const [steps, setSteps] = useState<ApprovalStep[]>(workflowSteps);
  const [saved, setSaved] = useState(false);

  if (!user || user.role !== 'admin') return null;

  const addStep = () => {
    setSteps(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        companyId: user.companyId,
        order: prev.length + 1,
        role: 'manager',
        label: `Step ${prev.length + 1}`,
      },
    ]);
  };

  const removeStep = (id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i + 1 })));
  };

  const updateStep = (id: string, field: keyof ApprovalStep, value: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSave = () => {
    setWorkflowSteps(steps);
    addAuditLog('Workflow Updated', 'workflow', undefined, `${steps.length} steps configured`);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-heading font-bold text-foreground">Workflow Configuration</h1>
        </div>
        <Button onClick={handleSave} className="glow gap-2">
          <Save className="h-4 w-4" />
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-xl p-6 card-shadow"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">Approval Steps</h2>
            <p className="text-sm text-muted-foreground mt-1">Define the approval chain for expense submissions</p>
          </div>
          <Button variant="outline" size="sm" onClick={addStep} className="gap-1.5">
            <Plus className="h-3 w-3" /> Add Step
          </Button>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-4 rounded-lg bg-background/50 border border-border/50"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md shrink-0">
                #{step.order}
              </span>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Label</Label>
                  <Input
                    value={step.label}
                    onChange={e => updateStep(step.id, 'label', e.target.value)}
                    className="bg-secondary border-border h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Role</Label>
                  <select
                    value={step.role}
                    onChange={e => updateStep(step.id, 'role', e.target.value)}
                    className="flex h-8 w-full rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
                  >
                    <option value="manager">Manager</option>
                    <option value="admin">Admin / Finance</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => removeStep(step.id)}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </div>

        {steps.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">
            No approval steps configured. Expenses will be auto-approved.
          </p>
        )}
      </motion.div>
    </DashboardLayout>
  );
}

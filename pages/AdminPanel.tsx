import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, GripVertical, Trash2, Users, Workflow } from 'lucide-react';
import { toast } from 'sonner';
import { Role } from '@/types';

export default function AdminPanel() {
  const { allUsers, addUser, updateUser } = useAuth();
  const { rules, updateRules } = useData();
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'employee' as Role, managerId: '' });

  const managers = allUsers.filter(u => u.role === 'manager' || u.role === 'admin');

  const handleAddUser = () => {
    addUser(newUser);
    toast.success('User created');
    setShowAddUser(false);
    setNewUser({ name: '', email: '', role: 'employee', managerId: '' });
  };

  const handleAddStep = () => {
    updateRules({
      approvalSequence: [...rules.approvalSequence, { role: 'reviewer', label: `Step ${rules.approvalSequence.length + 1}` }],
    });
  };

  const handleRemoveStep = (index: number) => {
    updateRules({
      approvalSequence: rules.approvalSequence.filter((_, i) => i !== index),
    });
  };

  const handleUpdateStepLabel = (index: number, label: string) => {
    const updated = [...rules.approvalSequence];
    updated[index] = { ...updated[index], label };
    updateRules({ approvalSequence: updated });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Admin Panel</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage users and configure approval rules</p>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="users" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Users</TabsTrigger>
            <TabsTrigger value="rules" className="gap-1.5"><Workflow className="h-3.5 w-3.5" /> Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            <Card className="card-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold">Team Members</CardTitle>
                <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5 gradient-primary hover:opacity-90 rounded-lg h-8 text-xs">
                      <Plus className="h-3.5 w-3.5" /> Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Name</Label>
                        <Input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="Full name" className="h-10" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Email</Label>
                        <Input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@company.com" className="h-10" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Role</Label>
                        <Select value={newUser.role} onValueChange={(v: Role) => setNewUser({ ...newUser, role: v })}>
                          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="employee">Employee</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {newUser.role === 'employee' && (
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Assigned Manager</Label>
                          <Select value={newUser.managerId} onValueChange={v => setNewUser({ ...newUser, managerId: v })}>
                            <SelectTrigger className="h-10"><SelectValue placeholder="Select manager" /></SelectTrigger>
                            <SelectContent>
                              {managers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <Button onClick={handleAddUser} className="w-full gradient-primary hover:opacity-90 font-semibold">Create User</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                        <th className="text-left py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Email</th>
                        <th className="text-left py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Role</th>
                        <th className="text-left py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Manager</th>
                        <th className="text-right py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map(u => {
                        const mgr = allUsers.find(m => m.id === u.managerId);
                        return (
                          <tr key={u.id} className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center">
                                  <span className="text-[10px] font-bold text-white">{u.name.split(' ').map(n => n[0]).join('')}</span>
                                </div>
                                <span className="font-medium text-[13px]">{u.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-muted-foreground text-[13px] font-mono">{u.email}</td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                                u.role === 'admin' ? 'bg-primary/10 text-primary' :
                                u.role === 'manager' ? 'bg-success/10 text-success' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-muted-foreground text-[13px]">{mgr?.name || '—'}</td>
                            <td className="py-3 px-3 text-right">
                              <Select value={u.role} onValueChange={(v: Role) => updateUser(u.id, { role: v })}>
                                <SelectTrigger className="h-8 w-28 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="manager">Manager</SelectItem>
                                  <SelectItem value="employee">Employee</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="mt-4 space-y-4">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Approval Sequence</CardTitle>
                <CardDescription className="text-xs">Define the order of approvals for expense requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {rules.approvalSequence.map((step, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-accent/50 rounded-xl border border-border/50">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                    <div className="h-6 w-6 rounded-md gradient-primary flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">{i + 1}</span>
                    </div>
                    <Input
                      value={step.label}
                      onChange={e => handleUpdateStepLabel(i, e.target.value)}
                      className="h-8 flex-1 text-sm"
                    />
                    {rules.approvalSequence.length > 1 && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive rounded-lg" onClick={() => handleRemoveStep(i)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={handleAddStep} className="gap-1.5 rounded-lg">
                  <Plus className="h-3.5 w-3.5" /> Add Step
                </Button>
              </CardContent>
            </Card>

            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Conditional Rules</CardTitle>
                <CardDescription className="text-xs">Configure percentage-based and special approver rules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between p-3 bg-accent/50 rounded-xl">
                  <div>
                    <Label className="text-sm font-medium">Manager must approve first</Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Require direct manager approval before escalation</p>
                  </div>
                  <Switch checked={rules.managerFirst} onCheckedChange={(v) => updateRules({ managerFirst: v })} />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Minimum approval percentage</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={rules.percentageRequired}
                      onChange={e => updateRules({ percentageRequired: parseInt(e.target.value) || 0 })}
                      className="w-24 h-9 font-mono"
                    />
                    <span className="text-sm text-muted-foreground">% of approvers must approve</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Special Approver</Label>
                  <Input
                    value={rules.specialApprover || ''}
                    onChange={e => updateRules({ specialApprover: e.target.value })}
                    placeholder="e.g., CFO"
                    className="h-9"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-accent/50 rounded-xl">
                  <div>
                    <Label className="text-sm font-medium">Auto-approve if special approver approves</Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Bypass percentage rule when {rules.specialApprover || 'special approver'} approves
                    </p>
                  </div>
                  <Switch checked={rules.autoApproveIfSpecial} onCheckedChange={(v) => updateRules({ autoApproveIfSpecial: v })} />
                </div>

                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-1.5">Logic Summary</p>
                  <p className="text-sm text-foreground">
                    Expense is approved when <strong>{rules.percentageRequired}%</strong> of approvers approve
                    {rules.autoApproveIfSpecial && rules.specialApprover && (
                      <> <strong>OR</strong> when <strong>{rules.specialApprover}</strong> approves</>
                    )}.
                    {rules.managerFirst && <> Direct manager must approve first.</>}
                  </p>
                </div>

                <Button onClick={() => toast.success('Rules saved!')} className="gradient-primary hover:opacity-90 font-semibold">Save Rules</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

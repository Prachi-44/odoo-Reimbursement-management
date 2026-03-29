import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';
import { DollarSign, Clock, CheckCircle2, XCircle, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';

const CHART_COLORS = [
  'hsl(250, 85%, 60%)', 'hsl(160, 84%, 39%)', 'hsl(36, 100%, 50%)',
  'hsl(340, 75%, 55%)', 'hsl(200, 95%, 50%)', 'hsl(280, 70%, 60%)',
  'hsl(20, 90%, 55%)', 'hsl(170, 60%, 45%)',
];

export default function DashboardPage() {
  const { user, company, allUsers } = useAuth();
  const { expenses } = useData();
  const { convert, loading: ratesLoading } = useCurrencyConversion(company?.currency || 'USD');

  const myExpenses = user?.role === 'admin' ? expenses : expenses.filter(e => e.userId === user?.id);
  const pending = myExpenses.filter(e => e.status === 'pending');
  const approved = myExpenses.filter(e => e.status === 'approved');
  const rejected = myExpenses.filter(e => e.status === 'rejected');

  const totalApproved = useMemo(() =>
    approved.reduce((sum, e) => sum + convert(e.amount, e.currency), 0),
    [approved, convert]
  );
  const totalPending = useMemo(() =>
    pending.reduce((sum, e) => sum + convert(e.amount, e.currency), 0),
    [pending, convert]
  );

  const cur = company?.currency || 'USD';
  const pendingForApproval = user?.role === 'manager' || user?.role === 'admin'
    ? expenses.filter(e => e.status === 'pending' && e.userId !== user?.id)
    : [];

  const stats = [
    { label: 'Total Approved', value: `${cur} ${totalApproved.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: DollarSign, gradient: 'gradient-primary', trend: '+12.5%', up: true },
    { label: 'Pending Amount', value: `${cur} ${totalPending.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: Clock, gradient: 'gradient-warning', trend: `${pending.length} items`, up: false },
    { label: 'Approved', value: approved.length.toString(), icon: CheckCircle2, gradient: 'gradient-success', trend: 'This month', up: true },
    { label: 'Rejected', value: rejected.length.toString(), icon: XCircle, gradient: 'gradient-danger', trend: 'All time', up: false },
  ];

  // Category breakdown for pie chart
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    myExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + convert(e.amount, e.currency);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [myExpenses, convert]);

  // Monthly trend for area chart
  const monthlyData = useMemo(() => {
    const map: Record<string, { approved: number; pending: number; rejected: number }> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach(m => { map[m] = { approved: 0, pending: 0, rejected: 0 }; });
    myExpenses.forEach(e => {
      const month = months[new Date(e.date).getMonth()];
      const amount = convert(e.amount, e.currency);
      if (e.status === 'approved') map[month].approved += amount;
      else if (e.status === 'pending') map[month].pending += amount;
      else if (e.status === 'rejected') map[month].rejected += amount;
    });
    return months.map(month => ({ month, ...map[month] }));
  }, [myExpenses, convert]);

  // Status breakdown for bar chart
  const statusData = useMemo(() => [
    { status: 'Pending', count: pending.length, fill: 'hsl(36, 100%, 50%)' },
    { status: 'Approved', count: approved.length, fill: 'hsl(160, 84%, 39%)' },
    { status: 'Rejected', count: rejected.length, fill: 'hsl(0, 84%, 60%)' },
  ], [pending, approved, rejected]);

  const recentExpenses = myExpenses.slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0]}</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Here's your financial overview for today</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={stat.label} className="card-shadow hover:card-shadow-md transition-shadow duration-300 overflow-hidden group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                    <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                    <div className="flex items-center gap-1">
                      {stat.up ? <ArrowUpRight className="h-3 w-3 text-success" /> : <ArrowDownRight className="h-3 w-3 text-muted-foreground" />}
                      <span className={`text-[11px] font-medium ${stat.up ? 'text-success' : 'text-muted-foreground'}`}>{stat.trend}</span>
                    </div>
                  </div>
                  <div className={`h-10 w-10 rounded-xl ${stat.gradient} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Monthly Trend */}
          <Card className="card-shadow lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Monthly Expense Trend ({cur})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="gradApproved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(36, 100%, 50%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(36, 100%, 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(0, 0%, 100%)',
                        border: '1px solid hsl(220, 13%, 90%)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px hsl(220 25% 10% / 0.08)',
                      }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                    <Area type="monotone" dataKey="approved" stroke="hsl(160, 84%, 39%)" fill="url(#gradApproved)" strokeWidth={2} name="Approved" />
                    <Area type="monotone" dataKey="pending" stroke="hsl(36, 100%, 50%)" fill="url(#gradPending)" strokeWidth={2} name="Pending" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card className="card-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">By Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-12">No data yet</p>
              ) : (
                <div className="h-[260px] flex flex-col">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3} strokeWidth={0}>
                          {categoryData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: 'hsl(0, 0%, 100%)',
                            border: '1px solid hsl(220, 13%, 90%)',
                            borderRadius: '8px',
                            fontSize: '11px',
                          }}
                          formatter={(value: number) => [`${cur} ${value.toLocaleString()}`, '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
                    {categoryData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-[10px] text-muted-foreground">{d.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status Bar Chart + Pending Approvals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="card-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" vertical={false} />
                    <XAxis dataKey="status" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(0, 0%, 100%)',
                        border: '1px solid hsl(220, 13%, 90%)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {pendingForApproval.length > 0 && (
            <Card className="card-shadow lg:col-span-2 border-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-5 w-5 rounded-md gradient-primary flex items-center justify-center">
                    <TrendingUp className="h-3 w-3 text-white" />
                  </div>
                  Awaiting Your Approval ({pendingForApproval.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingForApproval.slice(0, 4).map(exp => {
                    const submitter = allUsers.find(u => u.id === exp.userId);
                    return (
                      <div key={exp.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-xl hover:bg-accent transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                            <span className="text-[10px] font-bold text-muted-foreground">
                              {submitter?.name?.split(' ').map(n => n[0]).join('') || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{submitter?.name || 'Unknown'}</p>
                            <p className="text-[11px] text-muted-foreground">{exp.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold font-mono">{cur} {convert(exp.amount, exp.currency).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                          <StatusBadge status={exp.status} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Expenses */}
        <Card className="card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {recentExpenses.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-12 w-12 rounded-2xl gradient-primary mx-auto flex items-center justify-center mb-3 opacity-50">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm text-muted-foreground">No expenses yet. Submit your first expense to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Description</th>
                      <th className="text-left py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Category</th>
                      <th className="text-left py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                      <th className="text-right py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Original</th>
                      <th className="text-right py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Converted ({cur})</th>
                      <th className="text-right py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentExpenses.map(exp => (
                      <tr key={exp.id} className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
                        <td className="py-3 px-3 font-medium text-[13px]">{exp.description}</td>
                        <td className="py-3 px-3 text-muted-foreground text-[13px]">{exp.category}</td>
                        <td className="py-3 px-3 text-muted-foreground text-[13px]">{new Date(exp.date).toLocaleDateString()}</td>
                        <td className="py-3 px-3 text-right font-mono text-[13px]">{exp.currency} {exp.amount.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-[13px]">{cur} {convert(exp.amount, exp.currency).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td className="py-3 px-3 text-right"><StatusBadge status={exp.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

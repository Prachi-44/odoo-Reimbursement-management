import { useState } from "react";
import { useGetUsers, useCreateUser, getGetUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X, Shield, User as UserIcon } from "lucide-react";

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["manager", "employee"]),
  managerId: z.coerce.number().optional().nullable(),
});

export default function UsersManagement() {
  const { data: users, isLoading } = useGetUsers();
  const queryClient = useQueryClient();
  const createMutation = useCreateUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: "employee", managerId: null }
  });

  const onSubmit = async (data: z.infer<typeof userSchema>) => {
    try {
      await createMutation.mutateAsync({ data: { ...data, managerId: data.managerId || null } });
      queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
      setIsDialogOpen(false);
      form.reset();
    } catch (e) {
      console.error(e);
    }
  };

  const managers = users?.filter(u => u.role === "manager" || u.role === "admin") || [];

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold">Team Members</h2>
          <p className="text-muted-foreground mt-1">Manage users, roles, and reporting structures.</p>
        </div>
        <button 
          onClick={() => setIsDialogOpen(true)}
          className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">User</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Manager</th>
              <th className="px-6 py-4 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center">Loading...</td></tr>
            ) : (
              users?.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      user.role === 'admin' ? 'bg-primary/15 text-primary border-primary/25' :
                      user.role === 'manager' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                      'bg-secondary text-secondary-foreground border-border'
                    }`}>
                      {user.role === 'admin' && <Shield className="w-3 h-3" />}
                      {user.role === 'manager' && <UserIcon className="w-3 h-3" />}
                      <span className="capitalize">{user.role}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {users.find(u => u.id === user.managerId)?.name || '—'}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-display font-bold">Add New User</h3>
              <button onClick={() => setIsDialogOpen(false)} className="p-2 hover:bg-secondary rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Name</label>
                <input {...form.register("name")} className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Email</label>
                <input type="email" {...form.register("email")} className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Password (Temp)</label>
                <input type="text" {...form.register("password")} className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Role</label>
                  <select {...form.register("role")} className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20">
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Manager</label>
                  <select {...form.register("managerId")} className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20">
                    <option value="">None</option>
                    {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-border">
                <button type="submit" disabled={createMutation.isPending} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors">
                  {createMutation.isPending ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

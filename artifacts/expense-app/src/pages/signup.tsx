import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useSignup, useGetCurrencies } from "@workspace/api-client-react";
import { useAuthState } from "@/hooks/use-auth-state";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Building, Globe, Coins, User, Mail, Lock } from "lucide-react";

const signupSchema = z.object({
  companyName: z.string().min(2, "Company name required"),
  country: z.string().min(2, "Country required"),
  currency: z.string().min(3, "Currency required"),
  adminName: z.string().min(2, "Name required"),
  adminEmail: z.string().email("Invalid email"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Signup() {
  const [, setLocation] = useLocation();
  const { login: setAuthData } = useAuthState();
  const [serverError, setServerError] = useState("");
  
  const signupMutation = useSignup();
  const { data: currencies } = useGetCurrencies();
  
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { 
      companyName: "", country: "", currency: "USD", adminName: "", adminEmail: "", adminPassword: "" 
    }
  });

  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
    setServerError("");
    try {
      const res = await signupMutation.mutateAsync({ data });
      setAuthData(res.token, res.user);
      setLocation("/");
    } catch (err: any) {
      setServerError(err?.message || "Failed to create account");
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 flex flex-col justify-center sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex justify-center items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/30">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-7 h-7 object-contain" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">NovaExpense</h1>
        </div>
        <h2 className="text-center text-3xl font-bold font-display tracking-tight text-foreground">
          Create your workspace
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-card py-8 px-4 shadow-xl shadow-black/5 sm:rounded-3xl sm:px-10 border border-border/50">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
              <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-sm font-medium">
                {serverError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-semibold">Company Name</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                  <input {...form.register("companyName")} className="w-full pl-11 pr-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Country</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                  <input {...form.register("country")} className="w-full pl-11 pr-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Base Currency</label>
                <div className="relative">
                  <Coins className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                  <select {...form.register("currency")} className="w-full pl-11 pr-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none">
                    {currencies?.map(c => (
                      <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                    ))}
                    {!currencies && <option value="USD">USD</option>}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2 mt-4 pt-4 border-t border-border">
                <h3 className="text-lg font-display font-semibold mb-2">Admin Profile</h3>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-semibold">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                  <input {...form.register("adminName")} className="w-full pl-11 pr-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                  <input type="email" {...form.register("adminEmail")} className="w-full pl-11 pr-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                  <input type="password" {...form.register("adminPassword")} className="w-full pl-11 pr-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={signupMutation.isPending}
              className="w-full py-3.5 mt-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {signupMutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
              Create Workspace
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuthState } from "@/hooks/use-auth-state";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Lock } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { login: setAuthData } = useAuthState();
  const [serverError, setServerError] = useState("");
  
  const loginMutation = useLogin();
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setServerError("");
    try {
      const res = await loginMutation.mutateAsync({ data });
      setAuthData(res.token, res.user);
      setLocation("/");
    } catch (err: any) {
      setServerError(err?.message || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-[480px] xl:w-[560px]">
        <div className="mx-auto w-full max-w-sm lg:w-[400px]">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/30">
              <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-7 h-7 object-contain" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">NovaExpense</h1>
          </div>

          <h2 className="text-3xl font-bold font-display tracking-tight text-foreground mb-2">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Sign in to manage your corporate expenses</p>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
              <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-sm font-medium">
                {serverError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                <input
                  type="email"
                  {...form.register("email")}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary/50 border border-border focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-foreground"
                  placeholder="name@company.com"
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                <input
                  type="password"
                  {...form.register("password")}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary/50 border border-border focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-foreground"
                  placeholder="••••••••"
                />
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
              Sign In
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have a company account?{" "}
            <Link href="/signup" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Set up your workspace
            </Link>
          </p>
        </div>
      </div>
      
      <div className="hidden lg:flex relative w-0 flex-1 border-l border-border overflow-hidden flex-col items-center justify-end p-16"
        style={{ background: "linear-gradient(160deg, hsl(158 28% 72%) 0%, hsl(158 22% 52%) 40%, hsl(40 18% 82%) 100%)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 30% 20%, hsl(158 40% 90%) 0%, transparent 60%), radial-gradient(circle at 70% 80%, hsl(40 30% 90%) 0%, transparent 50%)" }} />
        <div className="relative max-w-xl bg-white/25 backdrop-blur-md border border-white/30 p-8 rounded-3xl shadow-xl">
          <h3 className="text-2xl font-bold font-display text-white mb-3">Enterprise expense management, simplified.</h3>
          <p className="text-white/85">Automate approvals, scan receipts with OCR, and gain real-time visibility into your corporate spend.</p>
        </div>
      </div>
    </div>
  );
}

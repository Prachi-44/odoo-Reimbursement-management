import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { fetchCountries, type CountryCurrency } from '@/lib/currency';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Zap } from 'lucide-react';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('');
  const [countries, setCountries] = useState<CountryCurrency[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loadingCountries, setLoadingCountries] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleLoadCountries = async () => {
    if (countries.length) return;
    setLoadingCountries(true);
    const c = await fetchCountries();
    setCountries(c);
    setLoadingCountries(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isSignup) {
      if (!name || !email || !password || !companyName || !country) {
        setError('All fields are required');
        return;
      }
      const selectedCountry = countries.find(c => c.name === country);
      const ok = signup(name, email, password, companyName, country, selectedCountry?.currency || 'USD');
      if (ok) navigate('/dashboard');
      else setError('Email already exists');
    } else {
      const ok = login(email, password);
      if (ok) navigate('/dashboard');
      else setError('Invalid credentials');
    }
  };

  const quickLogin = (demoEmail: string, demoPassword: string) => {
    const ok = login(demoEmail, demoPassword);
    if (ok) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-card">
        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/20 blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-accent/20 blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full bg-success/15 blur-2xl animate-float-slow" />
        </div>
        <div className="relative z-10 text-center px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <Zap className="h-4 w-4 text-accent" />
              <span className="text-sm text-foreground/80">Smart Expense Management</span>
            </div>
            <h1 className="text-5xl font-heading font-bold gradient-text mb-4">NovaExpense</h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Automate reimbursements with OCR receipt scanning, multi-level approvals, and real-time currency conversion.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-3xl font-heading font-bold gradient-text">NovaExpense</h1>
          </div>

          <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
            {isSignup ? 'Create Account' : 'Welcome back'}
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            {isSignup ? 'Set up your company account' : 'Sign in to your account'}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <div>
                  <Label className="text-foreground/80">Full Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="mt-1.5 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="text-foreground/80">Company Name</Label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Inc" className="mt-1.5 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="text-foreground/80">Country</Label>
                  <select
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    onFocus={handleLoadCountries}
                    className="mt-1.5 flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">Select country</option>
                    {loadingCountries && <option disabled>Loading...</option>}
                    {countries.map(c => (
                      <option key={c.name} value={c.name}>{c.name} ({c.currency})</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div>
              <Label className="text-foreground/80">Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="mt-1.5 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-foreground/80">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-secondary border-border pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full glow">
              {isSignup ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsSignup(!isSignup); setError(''); }}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {!isSignup && (
            <div className="mt-8">
              <p className="text-xs text-muted-foreground text-center mb-3">Quick login with demo accounts</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Admin', email: 'admin@expenseapp.com', pass: 'Admin@123', color: 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/20' },
                  { label: 'Manager', email: 'pm@expenseapp.com', pass: 'Manager@123', color: 'bg-accent/10 hover:bg-accent/20 text-accent border-accent/20' },
                  { label: 'Employee', email: 'employee@expenseapp.com', pass: 'Employee@123', color: 'bg-success/10 hover:bg-success/20 text-success border-success/20' },
                ].map(d => (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => quickLogin(d.email, d.pass)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${d.color}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

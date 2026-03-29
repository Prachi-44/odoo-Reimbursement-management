import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import { ExpensesProvider } from "@/lib/expenses-context";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import NewExpense from "./pages/NewExpense";
import ExpenseDetail from "./pages/ExpenseDetail";
import AdminSettings from "./pages/AdminSettings";
import AuditLogs from "./pages/AuditLogs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <ExpensesProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/expenses/new" element={<NewExpense />} />
              <Route path="/expenses/:id" element={<ExpenseDetail />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/audit-logs" element={<AuditLogs />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ExpensesProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

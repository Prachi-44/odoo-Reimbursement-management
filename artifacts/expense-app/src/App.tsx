import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { setupApiAuth } from "@/lib/api-setup";

// Pages
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Dashboard from "@/pages/dashboard";
import ExpensesList from "@/pages/expenses/list";
import NewExpense from "@/pages/expenses/new";
import ExpenseDetail from "@/pages/expenses/detail";
import Approvals from "@/pages/approvals";
import UsersManagement from "@/pages/admin/users";
import ApprovalRules from "@/pages/admin/rules";
import Settings from "@/pages/admin/settings";

import { AppLayout } from "@/components/layout/app-layout";

// Initialize the API client auth token injection
setupApiAuth();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthenticatedRoutes() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/expenses" component={ExpensesList} />
        <Route path="/expenses/new" component={NewExpense} />
        <Route path="/expenses/:id" component={ExpenseDetail} />
        <Route path="/approvals" component={Approvals} />
        <Route path="/admin/users" component={UsersManagement} />
        <Route path="/admin/rules" component={ApprovalRules} />
        <Route path="/admin/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/.*" component={AuthenticatedRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

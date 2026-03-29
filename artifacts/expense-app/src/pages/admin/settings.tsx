import { useState } from "react";
import { useGetMe, useUpdateCompanyCurrency, useGetCurrencies } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Building, Globe, Coins, Loader2 } from "lucide-react";

export default function Settings() {
  const { data: user } = useGetMe();
  const { data: currencies } = useGetCurrencies();
  const updateCurrency = useUpdateCompanyCurrency();
  const queryClient = useQueryClient();
  
  const [currency, setCurrency] = useState(user?.company.defaultCurrency || "USD");

  const handleSave = async () => {
    if (!user) return;
    try {
      await updateCurrency.mutateAsync({
        id: user.company.id,
        data: { currency }
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    } catch(e) {}
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold">Company Settings</h2>
        <p className="text-muted-foreground mt-1">Manage organizational preferences.</p>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        <div className="p-6 border-b border-border bg-secondary/20">
          <h3 className="font-display font-semibold text-lg flex items-center gap-2">
            <Building className="w-5 h-5 text-primary" /> Profile
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Company Name</label>
              <p className="text-lg font-medium mt-1">{user.company.name}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                <Globe className="w-4 h-4" /> Country
              </label>
              <p className="text-lg font-medium mt-1">{user.company.country}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        <div className="p-6 border-b border-border bg-secondary/20">
          <h3 className="font-display font-semibold text-lg flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" /> Financial Settings
          </h3>
        </div>
        <div className="p-6">
          <div className="max-w-md space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Default Base Currency</label>
              <p className="text-sm text-muted-foreground mb-3">Used for dashboard reporting and currency conversions.</p>
              <select 
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background"
              >
                {currencies?.map(c => (
                  <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={handleSave}
              disabled={updateCurrency.isPending || currency === user.company.defaultCurrency}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {updateCurrency.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useCreateExpense, useScanReceipt, useUploadReceipt, useGetCurrencies, getGetExpensesQueryKey } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, UploadCloud, Sparkles, AlertCircle } from "lucide-react";

const CATEGORIES = [
  "Travel",
  "Meals & Entertainment",
  "Office Supplies",
  "Software & Subscriptions",
  "Hardware & Equipment",
  "Training & Education",
  "Marketing",
  "Accommodation",
  "Transportation",
  "Healthcare",
  "Utilities",
  "Other",
];

const expenseSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.string().min(1, "Currency required"),
  category: z.string().min(1, "Category required"),
  description: z.string().min(5, "Description too short"),
  date: z.string().min(1, "Date required"),
  receiptUrl: z.string().nullable().optional(),
});

export default function NewExpense() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: currencies } = useGetCurrencies();
  const createMutation = useCreateExpense();
  const uploadMutation = useUploadReceipt();
  const scanMutation = useScanReceipt();
  
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      currency: "USD",
      category: "",
      description: "",
      date: new Date().toISOString().split('T')[0],
      receiptUrl: null
    }
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setReceiptImage(base64);
      
      // Auto-scan magic!
      setIsScanning(true);
      try {
        // 1. Upload for permanent URL
        const uploadRes = await uploadMutation.mutateAsync({
          data: { imageBase64: base64.split(',')[1], fileName: file.name, mimeType: file.type }
        });
        form.setValue("receiptUrl", uploadRes.url);

        // 2. Scan with OCR to autofill
        const scanRes = await scanMutation.mutateAsync({
          data: { imageBase64: base64.split(',')[1], mimeType: file.type }
        });
        
        if (scanRes.amount) form.setValue("amount", scanRes.amount);
        if (scanRes.date) form.setValue("date", scanRes.date.split('T')[0]);
        if (scanRes.currency) form.setValue("currency", scanRes.currency);
        if (scanRes.category && CATEGORIES.includes(scanRes.category)) {
          form.setValue("category", scanRes.category);
        }
        const parts = [scanRes.vendor, scanRes.description].filter(Boolean);
        if (parts.length > 0) {
          form.setValue("description", parts.join(" - "));
        }
      } catch (err) {
        console.error("OCR/Upload failed", err);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: z.infer<typeof expenseSchema>) => {
    try {
      await createMutation.mutateAsync({
        data: {
          ...data,
          date: new Date(data.date).toISOString()
        }
      });
      queryClient.invalidateQueries({ queryKey: getGetExpensesQueryKey() });
      setLocation("/expenses");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-display font-bold">Submit Expense</h2>
        <p className="text-muted-foreground mt-1">Upload a receipt to auto-fill details, or enter them manually.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              receiptImage ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary hover:bg-secondary/50'
            } aspect-[3/4] relative overflow-hidden`}
          >
            {receiptImage ? (
              <>
                <img src={receiptImage} alt="Receipt" className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm" />
                <img src={receiptImage} alt="Receipt" className="relative z-10 max-h-full max-w-full object-contain drop-shadow-xl rounded-lg" />
                {isScanning && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                    <Sparkles className="w-10 h-10 text-primary animate-pulse mb-3" />
                    <p className="font-semibold text-primary">AI is scanning receipt...</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4 text-primary">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">Upload Receipt</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-[200px]">Click to browse or drag image here. We'll extract the details automatically.</p>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
          </div>

          {createMutation.isError && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">Failed to submit expense. Please check all fields.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-6 sm:p-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-muted-foreground font-medium">$</span>
                    <input 
                      type="number" 
                      step="0.01"
                      {...form.register("amount")} 
                      className={`w-full pl-8 pr-4 py-3 rounded-xl bg-background border ${isScanning ? 'border-primary/50 bg-primary/5 animate-pulse' : 'border-border'} focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-lg font-display font-semibold`}
                    />
                  </div>
                  {form.formState.errors.amount && <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Currency</label>
                  <select 
                    {...form.register("currency")} 
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                  >
                    {currencies?.map(c => (
                      <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                    ))}
                    {!currencies && <option value="USD">USD</option>}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Date</label>
                  <input 
                    type="date" 
                    {...form.register("date")} 
                    className={`w-full px-4 py-3 rounded-xl bg-background border ${isScanning ? 'border-primary/50 bg-primary/5 animate-pulse' : 'border-border'} focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all`}
                  />
                  {form.formState.errors.date && <p className="text-xs text-destructive">{form.formState.errors.date.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Category</label>
                  <select 
                    {...form.register("category")} 
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  >
                    <option value="">Select category...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {form.formState.errors.category && <p className="text-xs text-destructive">{form.formState.errors.category.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Description / Vendor</label>
                <input 
                  type="text" 
                  {...form.register("description")} 
                  placeholder="e.g. Uber ride to airport"
                  className={`w-full px-4 py-3 rounded-xl bg-background border ${isScanning ? 'border-primary/50 bg-primary/5 animate-pulse' : 'border-border'} focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all`}
                />
                {form.formState.errors.description && <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>}
              </div>

              <div className="pt-6 border-t border-border flex justify-end gap-4">
                <button type="button" onClick={() => setLocation("/expenses")} className="px-6 py-3 font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createMutation.isPending || isScanning}
                  className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
                  Submit Expense
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

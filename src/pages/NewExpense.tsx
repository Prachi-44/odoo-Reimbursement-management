import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useExpenses } from '@/lib/expenses-context';
import { convertCurrency, COMMON_CURRENCIES } from '@/lib/currency';
import { EXPENSE_CATEGORIES } from '@/lib/types';
import type { Expense } from '@/lib/types';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { Upload, Scan, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import Tesseract from 'tesseract.js';

export default function NewExpense() {
  const { user, company, addAuditLog } = useAuth();
  const { addExpense, workflowSteps, addApproval } = useExpenses();
  const navigate = useNavigate();

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(company?.currency || 'USD');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user || !company) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image (JPEG, PNG, WEBP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB');
      return;
    }

    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
    setError('');
    setScanComplete(false);

    // Auto-scan
    await scanReceipt(file);
  };

  const scanReceipt = async (file: File) => {
    setScanning(true);
    try {
      const result = await Tesseract.recognize(file, 'eng');
      const text = result.data.text;
      parseReceiptText(text);
      setScanComplete(true);
    } catch {
      setError('OCR scan failed. Please fill in manually.');
    } finally {
      setScanning(false);
    }
  };

  const parseReceiptText = (text: string) => {
    // Extract amount
    const amountPatterns = [
      /(?:total|amount|sum|due|pay)[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i,
      /\$\s*([\d,]+\.\d{2})/,
      /([\d,]+\.\d{2})/,
    ];
    for (const p of amountPatterns) {
      const match = text.match(p);
      if (match) {
        setAmount(match[1].replace(',', ''));
        break;
      }
    }

    // Extract date
    const datePatterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
      /(\w{3,9}\s+\d{1,2},?\s+\d{4})/i,
    ];
    for (const p of datePatterns) {
      const match = text.match(p);
      if (match) {
        try {
          const d = new Date(match[1]);
          if (!isNaN(d.getTime())) {
            setDate(d.toISOString().split('T')[0]);
          }
        } catch { /* ignore */ }
        break;
      }
    }

    // Extract merchant (first line often)
    const lines = text.split('\n').filter(l => l.trim().length > 2);
    if (lines.length > 0) {
      setMerchant(lines[0].trim().slice(0, 50));
    }

    // Suggest category
    const lower = text.toLowerCase();
    if (lower.includes('restaurant') || lower.includes('food') || lower.includes('cafe') || lower.includes('lunch') || lower.includes('dinner')) {
      setCategory('Meals');
    } else if (lower.includes('uber') || lower.includes('taxi') || lower.includes('lyft')) {
      setCategory('Transportation');
    } else if (lower.includes('hotel') || lower.includes('airbnb') || lower.includes('inn')) {
      setCategory('Accommodation');
    } else if (lower.includes('flight') || lower.includes('airline') || lower.includes('airways')) {
      setCategory('Travel');
    } else if (lower.includes('office') || lower.includes('staples') || lower.includes('supplies')) {
      setCategory('Office Supplies');
    }
  };

  const handleCurrencyChange = async (newCurrency: string) => {
    setCurrency(newCurrency);
    if (amount && newCurrency !== company.currency) {
      setConverting(true);
      const result = await convertCurrency(parseFloat(amount), newCurrency, company.currency);
      setConvertedAmount(result);
      setConverting(false);
    } else {
      setConvertedAmount(null);
    }
  };

  const handleAmountChange = async (val: string) => {
    setAmount(val);
    if (val && currency !== company.currency) {
      setConverting(true);
      const result = await convertCurrency(parseFloat(val) || 0, currency, company.currency);
      setConvertedAmount(result);
      setConverting(false);
    } else {
      setConvertedAmount(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !description || !date) {
      setError('Please fill in all required fields');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const expense: Expense = {
      id: crypto.randomUUID(),
      userId: user.id,
      userName: user.name,
      amount: parsedAmount,
      currency,
      convertedAmount: convertedAmount ?? parsedAmount,
      companyCurrency: company.currency,
      category,
      description: description.trim().slice(0, 200),
      merchant: merchant.trim().slice(0, 100),
      date,
      receiptUrl: receiptPreview || undefined,
      status: 'submitted',
      createdAt: new Date().toISOString(),
    };

    addExpense(expense);

    // Create approval entries for each workflow step
    workflowSteps.forEach(step => {
      addApproval({
        id: crypto.randomUUID(),
        expenseId: expense.id,
        stepOrder: step.order,
        approverId: '',
        approverName: '',
        approverRole: step.role,
        stepLabel: step.label,
        decision: 'pending',
      });
    });

    addAuditLog('Expense Submitted', 'expense', expense.id, `${description} - ${currency} ${parsedAmount}`);
    navigate('/expenses');
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Submit New Expense</h1>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Receipt Upload */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-strong rounded-xl p-6 card-shadow"
        >
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Receipt Upload</h2>

          <div
            onClick={() => fileRef.current?.click()}
            className="relative border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden group"
          >
            {receiptPreview ? (
              <div className="relative">
                <img src={receiptPreview} alt="Receipt" className="max-h-64 mx-auto rounded-lg" />
                {scanning && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
                    <div className="absolute inset-x-0 h-0.5 bg-accent/80 shadow-[0_0_10px_hsl(175_80%_45%)] animate-scan-line" />
                    <div className="flex items-center gap-2 bg-card/80 px-4 py-2 rounded-full z-10">
                      <Scan className="h-4 w-4 text-accent animate-pulse" />
                      <span className="text-sm text-accent font-medium">Scanning receipt...</span>
                    </div>
                  </div>
                )}
                {scanComplete && !scanning && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-2 right-2 bg-success/20 text-success px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                  >
                    <CheckCircle className="h-3 w-3" /> Scanned
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Click to upload receipt image
                </p>
                <p className="text-xs text-muted-foreground/60">
                  JPEG, PNG, WEBP up to 10MB · Auto-scans with OCR
                </p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {scanComplete && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-success mt-3 text-center"
            >
              ✓ Fields auto-filled from receipt. Review and adjust as needed.
            </motion.p>
          )}
        </motion.div>

        {/* Expense Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-strong rounded-xl p-6 card-shadow"
        >
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Expense Details</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground/80">Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={e => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="mt-1.5 bg-secondary border-border"
                />
              </div>
              <div>
                <Label className="text-foreground/80">Currency</Label>
                <select
                  value={currency}
                  onChange={e => handleCurrencyChange(e.target.value)}
                  className="mt-1.5 flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                >
                  {COMMON_CURRENCIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {convertedAmount !== null && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20 text-sm"
              >
                {converting ? (
                  <Loader2 className="h-3 w-3 animate-spin text-accent" />
                ) : (
                  <ArrowRight className="h-3 w-3 text-accent" />
                )}
                <span className="text-accent">
                  {currency} {amount} ≈ {company.currency} {convertedAmount.toFixed(2)}
                </span>
              </motion.div>
            )}

            <div>
              <Label className="text-foreground/80">Category *</Label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="mt-1.5 flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              >
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-foreground/80">Merchant</Label>
              <Input
                value={merchant}
                onChange={e => setMerchant(e.target.value)}
                placeholder="e.g. Uber, Hilton"
                className="mt-1.5 bg-secondary border-border"
              />
            </div>

            <div>
              <Label className="text-foreground/80">Description *</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the expense..."
                className="mt-1.5 bg-secondary border-border min-h-[80px]"
              />
            </div>

            <div>
              <Label className="text-foreground/80">Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="mt-1.5 bg-secondary border-border"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 glow">Submit Expense</Button>
              <Button type="button" variant="outline" onClick={() => navigate('/expenses')}>Cancel</Button>
            </div>
          </form>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

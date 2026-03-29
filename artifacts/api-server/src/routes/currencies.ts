import { Router, type IRouter } from "express";
import { getCurrencyList, getExchangeRates, convertAmount } from "../services/currency.js";

const router: IRouter = Router();

router.get("/currencies", async (_req, res) => {
  const currencies = await getCurrencyList();
  res.json(currencies);
});

router.get("/currencies/rates/:base", async (req, res) => {
  const { base } = req.params;
  const rates = await getExchangeRates(base.toUpperCase());
  res.json(rates);
});

router.post("/currencies/convert", async (req, res) => {
  const { amount, fromCurrency, toCurrency } = req.body;
  if (!amount || !fromCurrency || !toCurrency) {
    res.status(400).json({ error: "amount, fromCurrency, and toCurrency are required" });
    return;
  }
  const result = await convertAmount(parseFloat(amount), fromCurrency.toUpperCase(), toCurrency.toUpperCase());
  res.json({
    amount: parseFloat(amount),
    fromCurrency: fromCurrency.toUpperCase(),
    toCurrency: toCurrency.toUpperCase(),
    ...result,
  });
});

export default router;

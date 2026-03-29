import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import expensesRouter from "./expenses.js";
import approvalRulesRouter from "./approvalRules.js";
import currenciesRouter from "./currencies.js";
import ocrRouter from "./ocr.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(expensesRouter);
router.use(approvalRulesRouter);
router.use(currenciesRouter);
router.use(ocrRouter);

export default router;

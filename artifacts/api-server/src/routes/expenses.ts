import { Router, type IRouter } from "express";
import { db, expensesTable, approvalsTable, usersTable, companiesTable } from "@workspace/db";
import { eq, and, desc, inArray } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth.js";
import { initializeWorkflow, processApproval } from "../services/workflow.js";
import { convertAmount } from "../services/currency.js";
import path from "path";
import fs from "fs";

const router: IRouter = Router();

async function getExpenseWithDetails(expenseId: number) {
  const expenses = await db
    .select({
      id: expensesTable.id,
      userId: expensesTable.userId,
      amount: expensesTable.amount,
      currency: expensesTable.currency,
      convertedAmount: expensesTable.convertedAmount,
      category: expensesTable.category,
      description: expensesTable.description,
      date: expensesTable.date,
      receiptUrl: expensesTable.receiptUrl,
      status: expensesTable.status,
      currentStep: expensesTable.currentStep,
      createdAt: expensesTable.createdAt,
      user: {
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        managerId: usersTable.managerId,
        companyId: usersTable.companyId,
        createdAt: usersTable.createdAt,
      },
    })
    .from(expensesTable)
    .innerJoin(usersTable, eq(expensesTable.userId, usersTable.id))
    .where(eq(expensesTable.id, expenseId))
    .limit(1);

  if (!expenses[0]) return null;
  const expense = expenses[0];

  const approvals = await db
    .select({
      id: approvalsTable.id,
      expenseId: approvalsTable.expenseId,
      approverId: approvalsTable.approverId,
      status: approvalsTable.status,
      comments: approvalsTable.comments,
      stepOrder: approvalsTable.stepOrder,
      createdAt: approvalsTable.createdAt,
      updatedAt: approvalsTable.updatedAt,
    })
    .from(approvalsTable)
    .where(eq(approvalsTable.expenseId, expenseId))
    .orderBy(approvalsTable.stepOrder);

  const approverIds = approvals.map((a) => a.approverId);
  const approvers = approverIds.length > 0
    ? await db
        .select({
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
          role: usersTable.role,
          managerId: usersTable.managerId,
          companyId: usersTable.companyId,
          createdAt: usersTable.createdAt,
        })
        .from(usersTable)
        .where(inArray(usersTable.id, approverIds))
    : [];

  const approvalsWithApprovers = approvals.map((a) => ({
    ...a,
    approver: approvers.find((u) => u.id === a.approverId)!,
  }));

  return { ...expense, approvals: approvalsWithApprovers };
}

router.get("/expenses", requireAuth, async (req: AuthRequest, res) => {
  const { status, userId: queryUserId } = req.query;
  const { userId, role, companyId } = req.user!;

  let expensesList;

  if (role === "employee") {
    const q = db
      .select({
        id: expensesTable.id,
        userId: expensesTable.userId,
        amount: expensesTable.amount,
        currency: expensesTable.currency,
        convertedAmount: expensesTable.convertedAmount,
        category: expensesTable.category,
        description: expensesTable.description,
        date: expensesTable.date,
        receiptUrl: expensesTable.receiptUrl,
        status: expensesTable.status,
        currentStep: expensesTable.currentStep,
        createdAt: expensesTable.createdAt,
        user: {
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
          role: usersTable.role,
          managerId: usersTable.managerId,
          companyId: usersTable.companyId,
          createdAt: usersTable.createdAt,
        },
      })
      .from(expensesTable)
      .innerJoin(usersTable, eq(expensesTable.userId, usersTable.id))
      .where(
        status
          ? and(eq(expensesTable.userId, userId), eq(expensesTable.status, status as string))
          : eq(expensesTable.userId, userId)
      )
      .orderBy(desc(expensesTable.createdAt));
    expensesList = await q;
  } else {
    const conditions = [eq(usersTable.companyId, companyId)];
    if (status) conditions.push(eq(expensesTable.status, status as string));
    if (queryUserId) conditions.push(eq(expensesTable.userId, parseInt(queryUserId as string)));

    expensesList = await db
      .select({
        id: expensesTable.id,
        userId: expensesTable.userId,
        amount: expensesTable.amount,
        currency: expensesTable.currency,
        convertedAmount: expensesTable.convertedAmount,
        category: expensesTable.category,
        description: expensesTable.description,
        date: expensesTable.date,
        receiptUrl: expensesTable.receiptUrl,
        status: expensesTable.status,
        currentStep: expensesTable.currentStep,
        createdAt: expensesTable.createdAt,
        user: {
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
          role: usersTable.role,
          managerId: usersTable.managerId,
          companyId: usersTable.companyId,
          createdAt: usersTable.createdAt,
        },
      })
      .from(expensesTable)
      .innerJoin(usersTable, eq(expensesTable.userId, usersTable.id))
      .where(and(...conditions))
      .orderBy(desc(expensesTable.createdAt));
  }

  const expensesWithApprovals = await Promise.all(
    expensesList.map(async (exp) => {
      const approvals = await db
        .select({
          id: approvalsTable.id,
          expenseId: approvalsTable.expenseId,
          approverId: approvalsTable.approverId,
          status: approvalsTable.status,
          comments: approvalsTable.comments,
          stepOrder: approvalsTable.stepOrder,
          createdAt: approvalsTable.createdAt,
          updatedAt: approvalsTable.updatedAt,
        })
        .from(approvalsTable)
        .where(eq(approvalsTable.expenseId, exp.id))
        .orderBy(approvalsTable.stepOrder);

      const approverIds = approvals.map((a) => a.approverId);
      const approvers = approverIds.length > 0
        ? await db
            .select({
              id: usersTable.id,
              name: usersTable.name,
              email: usersTable.email,
              role: usersTable.role,
              managerId: usersTable.managerId,
              companyId: usersTable.companyId,
              createdAt: usersTable.createdAt,
            })
            .from(usersTable)
            .where(inArray(usersTable.id, approverIds))
        : [];

      return {
        ...exp,
        approvals: approvals.map((a) => ({
          ...a,
          approver: approvers.find((u) => u.id === a.approverId)!,
        })),
      };
    })
  );

  res.json(expensesWithApprovals);
});

router.post("/expenses", requireAuth, async (req: AuthRequest, res) => {
  const { amount, currency, category, description, date, receiptUrl } = req.body;
  if (!amount || !currency || !category || !description || !date) {
    res.status(400).json({ error: "amount, currency, category, description, and date are required" });
    return;
  }

  const { userId, companyId } = req.user!;

  const company = await db.select().from(companiesTable).where(eq(companiesTable.id, companyId)).limit(1);
  const companyCurrency = company[0]?.defaultCurrency ?? "USD";

  let convertedAmount: number | null = null;
  if (currency !== companyCurrency) {
    const result = await convertAmount(parseFloat(amount), currency, companyCurrency);
    convertedAmount = result.convertedAmount;
  } else {
    convertedAmount = parseFloat(amount);
  }

  const [expense] = await db.insert(expensesTable).values({
    userId,
    amount: amount.toString(),
    currency,
    convertedAmount: convertedAmount?.toString() ?? null,
    category,
    description,
    date: new Date(date),
    receiptUrl: receiptUrl ?? null,
    status: "pending",
    currentStep: 1,
  }).returning();

  await initializeWorkflow(expense.id, userId, companyId);

  const expenseWithDetails = await getExpenseWithDetails(expense.id);
  res.status(201).json(expenseWithDetails);
});

router.get("/expenses/:id", requireAuth, async (req: AuthRequest, res) => {
  const expenseId = parseInt(req.params.id);
  const expense = await getExpenseWithDetails(expenseId);
  if (!expense) { res.status(404).json({ error: "Expense not found" }); return; }

  const { role, userId, companyId } = req.user!;
  if (role === "employee" && expense.userId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (role !== "admin" && expense.user.companyId !== companyId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json(expense);
});

router.post("/expenses/:id/approve", requireAuth, async (req: AuthRequest, res) => {
  const expenseId = parseInt(req.params.id);
  const { action, comments } = req.body;
  if (!action || !["approved", "rejected"].includes(action)) {
    res.status(400).json({ error: "action must be 'approved' or 'rejected'" });
    return;
  }

  const { userId, role, companyId } = req.user!;
  if (role === "employee") { res.status(403).json({ error: "Forbidden" }); return; }

  const expense = await db.select().from(expensesTable).where(eq(expensesTable.id, expenseId)).limit(1);
  if (!expense[0]) { res.status(404).json({ error: "Expense not found" }); return; }
  if (expense[0].status !== "pending") {
    res.status(400).json({ error: "Expense is not pending" });
    return;
  }

  const currentStep = expense[0].currentStep ?? 1;
  const approvalRecord = await db
    .select()
    .from(approvalsTable)
    .where(and(
      eq(approvalsTable.expenseId, expenseId),
      eq(approvalsTable.approverId, userId),
      eq(approvalsTable.stepOrder, currentStep),
    ))
    .limit(1);

  if (approvalRecord.length === 0) {
    res.status(403).json({ error: "You are not authorized to approve this expense at this step" });
    return;
  }

  await processApproval(expenseId, userId, action, comments, companyId);
  const updated = await getExpenseWithDetails(expenseId);
  res.json(updated);
});

router.post("/expenses/:id/override", requireAuth, async (req: AuthRequest, res) => {
  const expenseId = parseInt(req.params.id);
  const { status, comments } = req.body;
  const { role } = req.user!;

  if (role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  if (!["approved", "rejected"].includes(status)) {
    res.status(400).json({ error: "status must be 'approved' or 'rejected'" });
    return;
  }

  const expense = await db.select().from(expensesTable).where(eq(expensesTable.id, expenseId)).limit(1);
  if (!expense[0]) { res.status(404).json({ error: "Expense not found" }); return; }

  await db.update(expensesTable).set({ status }).where(eq(expensesTable.id, expenseId));

  if (comments) {
    const approvals = await db.select().from(approvalsTable).where(eq(approvalsTable.expenseId, expenseId)).limit(1);
    if (approvals[0]) {
      await db.update(approvalsTable).set({ comments, updatedAt: new Date() }).where(eq(approvalsTable.id, approvals[0].id));
    }
  }

  const updated = await getExpenseWithDetails(expenseId);
  res.json(updated);
});

router.post("/upload/receipt", requireAuth, async (req: AuthRequest, res) => {
  const { imageBase64, fileName, mimeType } = req.body;
  if (!imageBase64 || !fileName) {
    res.status(400).json({ error: "imageBase64 and fileName are required" });
    return;
  }

  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const ext = fileName.split(".").pop() || "jpg";
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = path.join(uploadsDir, uniqueName);

  const buffer = Buffer.from(imageBase64, "base64");
  fs.writeFileSync(filePath, buffer);

  const url = `/api/receipts/${uniqueName}`;
  res.json({ url });
});

router.get("/receipts/:filename", (req, res) => {
  const uploadsDir = path.join(process.cwd(), "uploads");
  const filePath = path.join(uploadsDir, req.params.filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  res.sendFile(filePath);
});

router.get("/dashboard/stats", requireAuth, async (req: AuthRequest, res) => {
  const { userId, role, companyId } = req.user!;

  let allExpenses;
  if (role === "employee") {
    allExpenses = await db
      .select({
        id: expensesTable.id,
        userId: expensesTable.userId,
        amount: expensesTable.amount,
        convertedAmount: expensesTable.convertedAmount,
        status: expensesTable.status,
      })
      .from(expensesTable)
      .where(eq(expensesTable.userId, userId));
  } else {
    allExpenses = await db
      .select({
        id: expensesTable.id,
        userId: expensesTable.userId,
        amount: expensesTable.amount,
        convertedAmount: expensesTable.convertedAmount,
        status: expensesTable.status,
      })
      .from(expensesTable)
      .innerJoin(usersTable, eq(expensesTable.userId, usersTable.id))
      .where(eq(usersTable.companyId, companyId));
  }

  const totalExpenses = allExpenses.length;
  const pendingExpenses = allExpenses.filter((e) => e.status === "pending").length;
  const approvedExpenses = allExpenses.filter((e) => e.status === "approved").length;
  const rejectedExpenses = allExpenses.filter((e) => e.status === "rejected").length;

  const totalAmount = allExpenses.reduce((sum, e) => sum + parseFloat(e.convertedAmount ?? e.amount), 0);
  const pendingAmount = allExpenses.filter((e) => e.status === "pending").reduce((sum, e) => sum + parseFloat(e.convertedAmount ?? e.amount), 0);
  const approvedAmount = allExpenses.filter((e) => e.status === "approved").reduce((sum, e) => sum + parseFloat(e.convertedAmount ?? e.amount), 0);

  const recentExpenseIds = allExpenses.slice(0, 5).map((e) => e.id);
  const recentExpenses = await Promise.all(recentExpenseIds.map(getExpenseWithDetails));

  const teamExpenses = role !== "employee" ? totalExpenses : 0;

  res.json({
    totalExpenses,
    pendingExpenses,
    approvedExpenses,
    rejectedExpenses,
    totalAmount,
    pendingAmount,
    approvedAmount,
    teamExpenses,
    recentExpenses: recentExpenses.filter(Boolean),
  });
});

export default router;

import { Router, type IRouter } from "express";
import { db, approvalRulesTable, approvalStepsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../lib/auth.js";

const router: IRouter = Router();

async function getRuleWithSteps(ruleId: number) {
  const rules = await db.select().from(approvalRulesTable).where(eq(approvalRulesTable.id, ruleId)).limit(1);
  if (!rules[0]) return null;
  const steps = await db.select().from(approvalStepsTable).where(eq(approvalStepsTable.ruleId, ruleId)).orderBy(approvalStepsTable.stepOrder);
  return { ...rules[0], steps };
}

router.get("/approval-rules", requireAuth, async (req: AuthRequest, res) => {
  const rules = await db.select().from(approvalRulesTable).where(eq(approvalRulesTable.companyId, req.user!.companyId));
  const rulesWithSteps = await Promise.all(rules.map((r) => getRuleWithSteps(r.id)));
  res.json(rulesWithSteps.filter(Boolean));
});

router.post("/approval-rules", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  const { ruleType, threshold, specificApproverId, isActive, steps } = req.body;
  if (!ruleType || !steps) {
    res.status(400).json({ error: "ruleType and steps are required" });
    return;
  }

  const [rule] = await db.insert(approvalRulesTable).values({
    companyId: req.user!.companyId,
    ruleType,
    threshold: threshold?.toString() ?? null,
    specificApproverId: specificApproverId ?? null,
    isActive: isActive ?? true,
  }).returning();

  if (steps?.length > 0) {
    await db.insert(approvalStepsTable).values(
      steps.map((step: { approverRole: string; approverId?: number; stepOrder: number }) => ({
        ruleId: rule.id,
        approverRole: step.approverRole,
        approverId: step.approverId ?? null,
        stepOrder: step.stepOrder,
      }))
    );
  }

  const ruleWithSteps = await getRuleWithSteps(rule.id);
  res.status(201).json(ruleWithSteps);
});

router.put("/approval-rules/:id", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  const ruleId = parseInt(req.params.id);
  const { ruleType, threshold, specificApproverId, isActive, steps } = req.body;

  const existing = await db.select().from(approvalRulesTable).where(
    and(eq(approvalRulesTable.id, ruleId), eq(approvalRulesTable.companyId, req.user!.companyId))
  ).limit(1);

  if (!existing[0]) { res.status(404).json({ error: "Rule not found" }); return; }

  await db.update(approvalRulesTable).set({
    ruleType,
    threshold: threshold?.toString() ?? null,
    specificApproverId: specificApproverId ?? null,
    isActive: isActive ?? true,
  }).where(eq(approvalRulesTable.id, ruleId));

  await db.delete(approvalStepsTable).where(eq(approvalStepsTable.ruleId, ruleId));

  if (steps?.length > 0) {
    await db.insert(approvalStepsTable).values(
      steps.map((step: { approverRole: string; approverId?: number; stepOrder: number }) => ({
        ruleId,
        approverRole: step.approverRole,
        approverId: step.approverId ?? null,
        stepOrder: step.stepOrder,
      }))
    );
  }

  const updated = await getRuleWithSteps(ruleId);
  res.json(updated);
});

router.delete("/approval-rules/:id", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  const ruleId = parseInt(req.params.id);
  const existing = await db.select().from(approvalRulesTable).where(
    and(eq(approvalRulesTable.id, ruleId), eq(approvalRulesTable.companyId, req.user!.companyId))
  ).limit(1);

  if (!existing[0]) { res.status(404).json({ error: "Rule not found" }); return; }

  await db.delete(approvalRulesTable).where(eq(approvalRulesTable.id, ruleId));
  res.status(204).send();
});

export default router;

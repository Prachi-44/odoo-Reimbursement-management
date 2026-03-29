import { db, expensesTable, approvalsTable, approvalRulesTable, approvalStepsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger.js";

export async function initializeWorkflow(expenseId: number, userId: number, companyId: number): Promise<void> {
  const rules = await db
    .select()
    .from(approvalRulesTable)
    .where(and(eq(approvalRulesTable.companyId, companyId), eq(approvalRulesTable.isActive, true)))
    .limit(1);

  if (rules.length === 0) {
    const managers = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.companyId, companyId), eq(usersTable.role, "manager")))
      .limit(1);

    if (managers.length > 0) {
      await db.insert(approvalsTable).values({
        expenseId,
        approverId: managers[0].id,
        status: "pending",
        stepOrder: 1,
      });
    } else {
      const admins = await db
        .select()
        .from(usersTable)
        .where(and(eq(usersTable.companyId, companyId), eq(usersTable.role, "admin")))
        .limit(1);
      if (admins.length > 0) {
        await db.insert(approvalsTable).values({
          expenseId,
          approverId: admins[0].id,
          status: "pending",
          stepOrder: 1,
        });
      }
    }
    return;
  }

  const rule = rules[0];
  const steps = await db
    .select()
    .from(approvalStepsTable)
    .where(eq(approvalStepsTable.ruleId, rule.id))
    .orderBy(approvalStepsTable.stepOrder);

  for (const step of steps) {
    let approverId = step.approverId;

    if (!approverId) {
      if (step.approverRole === "manager") {
        const submitter = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
        if (submitter[0]?.managerId) {
          approverId = submitter[0].managerId;
        } else {
          const managers = await db
            .select()
            .from(usersTable)
            .where(and(eq(usersTable.companyId, companyId), eq(usersTable.role, "manager")))
            .limit(1);
          approverId = managers[0]?.id ?? null;
        }
      } else if (step.approverRole === "admin") {
        const admins = await db
          .select()
          .from(usersTable)
          .where(and(eq(usersTable.companyId, companyId), eq(usersTable.role, "admin")))
          .limit(1);
        approverId = admins[0]?.id ?? null;
      }
    }

    if (approverId) {
      await db.insert(approvalsTable).values({
        expenseId,
        approverId,
        status: step.stepOrder === 1 ? "pending" : "pending",
        stepOrder: step.stepOrder,
      });
    }
  }
}

export async function evaluateRule(
  rule: { ruleType: string; threshold: string | null; specificApproverId: number | null },
  approvals: Array<{ status: string; approverId: number }>
): Promise<"approved" | "rejected" | "pending"> {
  const totalApprovals = approvals.length;
  const approvedCount = approvals.filter((a) => a.status === "approved").length;
  const rejectedCount = approvals.filter((a) => a.status === "rejected").length;

  if (rejectedCount > 0) return "rejected";
  if (totalApprovals === 0) return "pending";

  if (rule.ruleType === "percentage") {
    const threshold = parseFloat(rule.threshold ?? "100") / 100;
    const ratio = approvedCount / totalApprovals;
    return ratio >= threshold ? "approved" : "pending";
  }

  if (rule.ruleType === "specific") {
    if (rule.specificApproverId) {
      const specificApproval = approvals.find((a) => a.approverId === rule.specificApproverId);
      if (specificApproval?.status === "approved") return "approved";
    }
    return approvedCount === totalApprovals ? "approved" : "pending";
  }

  if (rule.ruleType === "hybrid") {
    const threshold = parseFloat(rule.threshold ?? "60") / 100;
    const ratio = approvedCount / totalApprovals;
    const percentageApproved = ratio >= threshold;

    let specificApproved = false;
    if (rule.specificApproverId) {
      const specificApproval = approvals.find((a) => a.approverId === rule.specificApproverId);
      specificApproved = specificApproval?.status === "approved";
    }

    return percentageApproved || specificApproved ? "approved" : "pending";
  }

  return approvedCount === totalApprovals ? "approved" : "pending";
}

export async function processApproval(
  expenseId: number,
  approverId: number,
  action: "approved" | "rejected",
  comments: string | undefined,
  companyId: number
): Promise<void> {
  const expense = await db.select().from(expensesTable).where(eq(expensesTable.id, expenseId)).limit(1);
  if (!expense[0]) return;

  const currentStep = expense[0].currentStep ?? 1;

  await db
    .update(approvalsTable)
    .set({ status: action, comments: comments ?? null, updatedAt: new Date() })
    .where(and(eq(approvalsTable.expenseId, expenseId), eq(approvalsTable.approverId, approverId), eq(approvalsTable.stepOrder, currentStep)));

  if (action === "rejected") {
    await db.update(expensesTable).set({ status: "rejected" }).where(eq(expensesTable.id, expenseId));
    return;
  }

  const rules = await db
    .select()
    .from(approvalRulesTable)
    .where(and(eq(approvalRulesTable.companyId, companyId), eq(approvalRulesTable.isActive, true)))
    .limit(1);

  const allApprovals = await db
    .select()
    .from(approvalsTable)
    .where(eq(approvalsTable.expenseId, expenseId));

  const currentStepApprovals = allApprovals.filter((a) => a.stepOrder === currentStep);

  if (rules.length > 0) {
    const rule = rules[0];
    const decision = await evaluateRule(
      {
        ruleType: rule.ruleType,
        threshold: rule.threshold,
        specificApproverId: rule.specificApproverId,
      },
      currentStepApprovals
    );

    if (decision === "approved") {
      const nextStep = currentStep + 1;
      const nextApproval = allApprovals.find((a) => a.stepOrder === nextStep);

      if (nextApproval) {
        await db.update(expensesTable).set({ currentStep: nextStep }).where(eq(expensesTable.id, expenseId));
      } else {
        await db.update(expensesTable).set({ status: "approved" }).where(eq(expensesTable.id, expenseId));
      }
    } else if (decision === "rejected") {
      await db.update(expensesTable).set({ status: "rejected" }).where(eq(expensesTable.id, expenseId));
    }
  } else {
    const pendingInStep = currentStepApprovals.filter((a) => a.status === "pending").length;
    if (pendingInStep === 0) {
      const nextStep = currentStep + 1;
      const nextApproval = allApprovals.find((a) => a.stepOrder === nextStep);
      if (nextApproval) {
        await db.update(expensesTable).set({ currentStep: nextStep }).where(eq(expensesTable.id, expenseId));
      } else {
        await db.update(expensesTable).set({ status: "approved" }).where(eq(expensesTable.id, expenseId));
      }
    }
  }

  logger.info({ expenseId, approverId, action }, "Approval processed");
}

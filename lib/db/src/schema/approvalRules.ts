import { pgTable, serial, integer, text, timestamp, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { usersTable } from "./users";

export const approvalRulesTable = pgTable("approval_rules", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companiesTable.id),
  ruleType: text("rule_type", { enum: ["percentage", "specific", "hybrid"] }).notNull(),
  threshold: numeric("threshold", { precision: 5, scale: 2 }),
  specificApproverId: integer("specific_approver_id").references(() => usersTable.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const approvalStepsTable = pgTable("approval_steps", {
  id: serial("id").primaryKey(),
  ruleId: integer("rule_id").notNull().references(() => approvalRulesTable.id, { onDelete: "cascade" }),
  approverRole: text("approver_role", { enum: ["manager", "admin", "employee"] }).notNull(),
  approverId: integer("approver_id").references(() => usersTable.id),
  stepOrder: integer("step_order").notNull(),
});

export const insertApprovalRuleSchema = createInsertSchema(approvalRulesTable).omit({ id: true, createdAt: true });
export type InsertApprovalRule = z.infer<typeof insertApprovalRuleSchema>;
export type ApprovalRule = typeof approvalRulesTable.$inferSelect;

export const insertApprovalStepSchema = createInsertSchema(approvalStepsTable).omit({ id: true });
export type InsertApprovalStep = z.infer<typeof insertApprovalStepSchema>;
export type ApprovalStep = typeof approvalStepsTable.$inferSelect;

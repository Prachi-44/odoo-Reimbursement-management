import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { expensesTable } from "./expenses";
import { usersTable } from "./users";

export const approvalsTable = pgTable("approvals", {
  id: serial("id").primaryKey(),
  expenseId: integer("expense_id").notNull().references(() => expensesTable.id),
  approverId: integer("approver_id").notNull().references(() => usersTable.id),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  comments: text("comments"),
  stepOrder: integer("step_order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertApprovalSchema = createInsertSchema(approvalsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertApproval = z.infer<typeof insertApprovalSchema>;
export type Approval = typeof approvalsTable.$inferSelect;

import { Router, type IRouter } from "express";
import { db, usersTable, companiesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole, hashPassword, type AuthRequest } from "../lib/auth.js";

const router: IRouter = Router();

router.get("/users", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  const users = await db
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
    .where(eq(usersTable.companyId, req.user!.companyId));

  res.json(users);
});

router.post("/users", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  const { name, email, password, role, managerId } = req.body;
  if (!name || !email || !password || !role) {
    res.status(400).json({ error: "name, email, password, and role are required" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already exists" });
    return;
  }

  const hashedPassword = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    name,
    email,
    password: hashedPassword,
    role,
    managerId: managerId ?? null,
    companyId: req.user!.companyId,
  }).returning();

  const { password: _, ...safeUser } = user;
  res.status(201).json(safeUser);
});

router.patch("/users/:id", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  const userId = parseInt(req.params.id);
  const { name, role, managerId } = req.body;

  const [user] = await db.select().from(usersTable).where(
    and(eq(usersTable.id, userId), eq(usersTable.companyId, req.user!.companyId))
  ).limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({
      ...(name !== undefined && { name }),
      ...(role !== undefined && { role }),
      ...(managerId !== undefined && { managerId: managerId }),
    })
    .where(eq(usersTable.id, userId))
    .returning();

  const { password: _, ...safeUser } = updated;
  res.json(safeUser);
});

router.patch("/companies/:id/currency", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  const { currency } = req.body;
  if (!currency) { res.status(400).json({ error: "currency is required" }); return; }

  const [updated] = await db
    .update(companiesTable)
    .set({ defaultCurrency: currency })
    .where(eq(companiesTable.id, req.user!.companyId))
    .returning();

  res.json(updated);
});

export default router;

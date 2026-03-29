import { Router, type IRouter } from "express";
import { db, companiesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, hashPassword, comparePassword, requireAuth, getUserWithCompany, type AuthRequest } from "../lib/auth.js";

const router: IRouter = Router();

router.post("/auth/signup", async (req, res) => {
  const { companyName, country, currency, adminName, adminEmail, adminPassword } = req.body;

  if (!companyName || !country || !currency || !adminName || !adminEmail || !adminPassword) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already exists" });
    return;
  }

  const [company] = await db.insert(companiesTable).values({
    name: companyName,
    country,
    defaultCurrency: currency,
  }).returning();

  const hashedPassword = await hashPassword(adminPassword);
  const [user] = await db.insert(usersTable).values({
    name: adminName,
    email: adminEmail,
    password: hashedPassword,
    role: "admin",
    companyId: company.id,
  }).returning();

  const token = signToken({ userId: user.id, companyId: company.id, role: user.role });
  const userWithCompany = await getUserWithCompany(user.id);

  res.status(201).json({ token, user: userWithCompany });
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken({ userId: user.id, companyId: user.companyId, role: user.role });
  const userWithCompany = await getUserWithCompany(user.id);

  res.json({ token, user: userWithCompany });
});

router.get("/auth/me", requireAuth, async (req: AuthRequest, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const user = await getUserWithCompany(req.user.userId);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(user);
});

export default router;

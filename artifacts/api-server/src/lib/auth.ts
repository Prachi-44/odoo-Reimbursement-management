import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";
import { db, usersTable, companiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.SESSION_SECRET || "change-me-in-production";

export function signToken(payload: { userId: number; companyId: number; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number; companyId: number; role: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: number; companyId: number; role: string };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    companyId: number;
    role: string;
  };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

export async function getUserWithCompany(userId: number) {
  const result = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      managerId: usersTable.managerId,
      companyId: usersTable.companyId,
      createdAt: usersTable.createdAt,
      company: {
        id: companiesTable.id,
        name: companiesTable.name,
        country: companiesTable.country,
        defaultCurrency: companiesTable.defaultCurrency,
        createdAt: companiesTable.createdAt,
      },
    })
    .from(usersTable)
    .innerJoin(companiesTable, eq(usersTable.companyId, companiesTable.id))
    .where(eq(usersTable.id, userId))
    .limit(1);

  return result[0] ?? null;
}

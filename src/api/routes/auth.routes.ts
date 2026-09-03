import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../../db/index.js';
import { agencies } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { env } from '../../config/env.js';

export const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Missing fields' });
      return;
    }

    const existing = await db.query.agencies.findFirst({ where: eq(agencies.email, email) });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [agency] = await db.insert(agencies).values({ name, email, passwordHash }).returning();
    const token = jwt.sign({ agencyId: agency.id }, env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, agency: { id: agency.id, name: agency.name, email: agency.email } });
  } catch (err) {
    res.status(500).json({ error: `Registration failed: ${err}` });
  }
});

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const agency = await db.query.agencies.findFirst({ where: eq(agencies.email, email) });

    if (!agency) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, agency.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ agencyId: agency.id }, env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, agency: { id: agency.id, name: agency.name, email: agency.email } });
  } catch (err) {
    res.status(500).json({ error: `Login failed: ${err}` });
  }
});
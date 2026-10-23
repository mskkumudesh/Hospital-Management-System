import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { run } from '../db.js';
import type { Role } from '../roles.js';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, config.jwtSecret) as Request['user'];
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}

/** Allow the listed roles (and always admin). */
export const authorize =
  (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) =>
    req.user.role === 'admin' || roles.includes(req.user.role)
      ? next()
      : res.status(403).json({ error: 'You do not have access to this action.' });

/** Log every change, and every read of patient or record data. */
export function audit(req: Request, _res: Response, next: NextFunction) {
  if (req.method !== 'GET' || /patients|records/.test(req.path)) {
    run('INSERT INTO audit_logs(user_id,action,path,ip) VALUES(?,?,?,?)', [
      req.user.id,
      req.method,
      req.originalUrl.slice(0, 200),
      req.ip,
    ]).catch(() => {});
  }
  next();
}

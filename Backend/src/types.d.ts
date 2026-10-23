import type { Role } from './roles.js';

declare global {
  namespace Express {
    interface Request {
      user: { id: number; role: Role; name: string };
    }
  }
}
export {};

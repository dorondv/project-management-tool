import { Request } from 'express';
import type { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: User;
    }
  }
}

export {};


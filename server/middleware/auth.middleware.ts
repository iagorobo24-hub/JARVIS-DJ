import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change_this_to_random_64_char_string";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'free' | 'artist' | 'pro' | 'label';
  };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "missing_token" });
  }

  const token = authHeader.split(" ")[1];
  
  // Allow mock token for Phase 2 development
  if (token === "mock_token_for_phase_2") {
    req.user = { id: "mock-user-id", email: "duranromeraiago@gmail.com", role: "pro" };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "token_expired" });
    }
    return res.status(401).json({ error: "invalid_token" });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "insufficient_permissions" });
    }
    next();
  };
};

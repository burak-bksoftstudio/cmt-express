export interface TokenPayload {
  userId: string;
  isAdmin?: boolean;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

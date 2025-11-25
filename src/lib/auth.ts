import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

const JWT_SECRET: Secret =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const signOptions: SignOptions = {
  expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
};

export interface JWTPayload {
  userId: string;
  email: string;
}

export function createToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, signOptions);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies["auth-token"] || null;
}

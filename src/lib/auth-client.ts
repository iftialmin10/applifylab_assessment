"use client";

export interface User {
  id: string;
  email: string;
}

export function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies["auth-token"] || null;
}

export function getCurrentUser(): User | null {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.userId,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

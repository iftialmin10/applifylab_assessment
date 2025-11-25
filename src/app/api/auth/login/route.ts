import { compare } from "bcryptjs";
import { NextResponse } from "next/server";

import { createToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    const { fieldErrors } = parsed.error.flatten();
    return NextResponse.json(
      {
        message: "Please fix the highlighted errors",
        errors: fieldErrors,
      },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValidPassword = await compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = createToken({
      userId: user.id,
      email: user.email,
    });

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
        },
      },
      { status: 200 }
    );

    const isProduction = process.env.NODE_ENV === "production";
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "An error occurred during login" },
      { status: 500 }
    );
  }
}

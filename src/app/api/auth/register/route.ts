import { NextResponse } from "next/server";
import { hash } from "bcryptjs";

import { createToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

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

  const parsed = registerSchema.safeParse(body);

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
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
      },
    });

    const token = createToken({
      userId: user.id,
      email: user.email,
    });

    const response = NextResponse.json(
      {
        message: "Registration successful",
        user: {
          id: user.id,
          email: user.email,
        },
      },
      { status: 201 }
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
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An error occurred during registration" },
      { status: 500 }
    );
  }
}

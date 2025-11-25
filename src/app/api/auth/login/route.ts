import { NextResponse } from "next/server";

import { loginSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch (_error) {
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

  return NextResponse.json({
    message: "Login request accepted",
    data: parsed.data,
  });
}

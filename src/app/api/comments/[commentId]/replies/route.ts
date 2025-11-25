import { NextResponse } from "next/server";

import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createReplySchema } from "@/lib/validations/comment";
import { checkRateLimit } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { commentId } = await params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 }
      );
    }

    // Rate limiting
    const rateLimit = checkRateLimit(
      `reply:create:${payload.userId}`,
      30,
      60000
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Sanitize content
    const { sanitizeInput } = await import("@/lib/security");
    if (body.content) {
      body.content = sanitizeInput(body.content);
    }

    const parsed = createReplySchema.safeParse(body);

    if (!parsed.success) {
      const { fieldErrors } = parsed.error.flatten();
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: fieldErrors,
        },
        { status: 400 }
      );
    }

    const reply = await prisma.reply.create({
      data: {
        content: parsed.data.content,
        commentId,
        authorId: payload.userId,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Reply created successfully",
        reply: {
          id: reply.id,
          content: reply.content,
          createdAt: reply.createdAt,
          author: reply.author,
          likeCount: reply._count.likes,
          isLiked: false,
          likedBy: [],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating reply:", error);
    return NextResponse.json(
      { message: "Failed to create reply" },
      { status: 500 }
    );
  }
}

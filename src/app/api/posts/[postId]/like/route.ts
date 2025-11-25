import { NextResponse } from "next/server";

import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
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

    const { postId } = await params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: payload.userId,
          postId: postId,
        },
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });

      return NextResponse.json(
        { message: "Post unliked", liked: false },
        { status: 200 }
      );
    } else {
      await prisma.like.create({
        data: {
          userId: payload.userId,
          postId: postId,
        },
      });

      return NextResponse.json(
        { message: "Post liked", liked: true },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { message: "Failed to toggle like" },
      { status: 500 }
    );
  }
}

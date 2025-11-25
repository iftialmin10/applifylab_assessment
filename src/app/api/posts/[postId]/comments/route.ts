import { NextResponse } from "next/server";

import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCommentSchema } from "@/lib/validations/comment";
import { checkRateLimit } from "@/lib/security";
import { parsePaginationParams, DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const token = getTokenFromRequest(request);
    const userId = token ? verifyToken(token)?.userId : null;

    const clientId =
      userId || request.headers.get("x-forwarded-for") || "anonymous";
    const rateLimit = checkRateLimit(`comments:${clientId}`, 200, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const url = new URL(request.url);
    const { limit } = parsePaginationParams(url.searchParams);

    const comments = await prisma.comment.findMany({
      where: { postId },
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            email: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                email: true,
              },
            },
            likes: {
              select: {
                userId: true,
                user: {
                  select: {
                    id: true,
                    email: true,
                  },
                },
              },
            },
            _count: {
              select: {
                likes: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        likes: {
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const commentsWithLikes = comments.map((comment) => {
      const isLiked = userId
        ? comment.likes.some((like) => like.userId === userId)
        : false;
      const likedBy = comment.likes.map((like) => ({
        id: like.user.id,
        email: like.user.email,
      }));

      const repliesWithLikes = comment.replies.map((reply) => {
        const replyIsLiked = userId
          ? reply.likes.some((like) => like.userId === userId)
          : false;
        const replyLikedBy = reply.likes.map((like) => ({
          id: like.user.id,
          email: like.user.email,
        }));

        return {
          id: reply.id,
          content: reply.content,
          createdAt: reply.createdAt,
          author: reply.author,
          likeCount: reply._count.likes,
          isLiked: replyIsLiked,
          likedBy: replyLikedBy,
        };
      });

      return {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: comment.author,
        likeCount: comment._count.likes,
        isLiked,
        likedBy,
        replies: repliesWithLikes,
      };
    });

    return NextResponse.json({ comments: commentsWithLikes }, { status: 200 });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { message: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

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

    const rateLimit = checkRateLimit(
      `comment:create:${payload.userId}`,
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

    const { sanitizeInput } = await import("@/lib/security");
    if (body.content) {
      body.content = sanitizeInput(body.content);
    }

    const parsed = createCommentSchema.safeParse(body);

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

    const comment = await prisma.comment.create({
      data: {
        content: parsed.data.content,
        postId,
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
        message: "Comment created successfully",
        comment: {
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          author: comment.author,
          likeCount: comment._count.likes,
          isLiked: false,
          likedBy: [],
          replies: [],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { message: "Failed to create comment" },
      { status: 500 }
    );
  }
}

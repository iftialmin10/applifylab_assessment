import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPostSchema } from "@/lib/validations/post";
import { parsePaginationParams, DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { checkRateLimit } from "@/lib/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const userId = token ? verifyToken(token)?.userId : null;

    const clientId =
      userId || request.headers.get("x-forwarded-for") || "anonymous";
    const rateLimit = checkRateLimit(`posts:${clientId}`, 100, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
            ),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimit.resetTime),
          },
        }
      );
    }

    const url = new URL(request.url);
    const { cursor, limit } = parsePaginationParams(url.searchParams);
    const pageSize = limit || DEFAULT_PAGE_SIZE;

    const where = cursor
      ? {
          id: {
            lt: cursor,
          },
        }
      : {};

    const posts = await prisma.post.findMany({
      where,
      take: pageSize + 1,
      select: {
        id: true,
        content: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            email: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const hasMore = posts.length > pageSize;
    const postsToReturn = hasMore ? posts.slice(0, pageSize) : posts;

    const userLikes = userId
      ? await prisma.like.findMany({
          where: {
            userId,
            postId: {
              in: postsToReturn.map((p) => p.id),
            },
          },
          select: {
            postId: true,
          },
        })
      : [];

    const likedPostIds = new Set(userLikes.map((l) => l.postId));

    const postIds = postsToReturn.map((p) => p.id);
    const allLikes =
      !cursor && postIds.length > 0
        ? await prisma.like.findMany({
            where: {
              postId: {
                in: postIds,
              },
            },
            select: {
              postId: true,
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          })
        : [];

    const likesByPostId: Record<
      string,
      Array<{ id: string; email: string }>
    > = {};
    for (const like of allLikes) {
      if (!like.postId) continue;
      if (!likesByPostId[like.postId]) {
        likesByPostId[like.postId] = [];
      }
      if (likesByPostId[like.postId].length < 10) {
        likesByPostId[like.postId].push({
          id: like.user.id,
          email: like.user.email,
        });
      }
    }

    const postsWithLikes = postsToReturn.map((post) => {
      const isLiked = likedPostIds.has(post.id);
      const likedBy = likesByPostId[post.id] || [];

      return {
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        author: post.author,
        likeCount: post._count.likes,
        isLiked,
        likedBy,
      };
    });

    const nextCursor =
      hasMore && postsToReturn.length > 0
        ? postsToReturn[postsToReturn.length - 1].id
        : null;

    return NextResponse.json(
      {
        posts: postsWithLikes,
        pagination: {
          nextCursor,
          hasMore: nextCursor !== null,
        },
      },
      {
        status: 200,
        headers: {
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(rateLimit.resetTime),
        },
      }
    );
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { message: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(
      `post:create:${payload.userId}`,
      10,
      60000
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
            ),
          },
        }
      );
    }

    const formData = await request.formData();
    const content = formData.get("content") as string | null;
    const imageFile = formData.get("image") as File | null;

    let imageUrl: string | undefined;

    if (imageFile && imageFile.size > 0) {
      const { validateImageFile } = await import("@/lib/security");
      const validation = validateImageFile(imageFile);
      if (!validation.valid) {
        return NextResponse.json(
          { message: validation.error },
          { status: 400 }
        );
      }

      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const sanitizedFilename = imageFile.name
        .replace(/[^a-zA-Z0-9.-]/g, "_")
        .slice(0, 100);

      const uploadsDir = join(process.cwd(), "public", "uploads", "posts");
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      const timestamp = Date.now();
      const filename = `${timestamp}-${sanitizedFilename}`;
      const filepath = join(uploadsDir, filename);

      await writeFile(filepath, buffer);
      imageUrl = `/uploads/posts/${filename}`;
    }

    const { sanitizeContent } = await import("@/lib/security");
    const sanitizedContent = sanitizeContent(content);

    const parsed = createPostSchema.safeParse({
      content: sanitizedContent,
      imageUrl: imageUrl || undefined,
    });

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

    const post = await prisma.post.create({
      data: {
        content: parsed.data.content,
        imageUrl: parsed.data.imageUrl,
        authorId: payload.userId,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    const postResponse = {
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      author: post.author,
      likeCount: 0,
      isLiked: false,
      likedBy: [],
    };

    return NextResponse.json(
      {
        message: "Post created successfully",
        post: postResponse,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating post:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create post";
    return NextResponse.json(
      { message: errorMessage, error: String(error) },
      { status: 500 }
    );
  }
}

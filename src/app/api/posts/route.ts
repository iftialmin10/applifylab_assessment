import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPostSchema } from "@/lib/validations/post";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const userId = token ? verifyToken(token)?.userId : null;

    const posts = await prisma.post.findMany({
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
        createdAt: "desc",
      },
    });

    const postsWithLikes = posts.map((post) => {
      const isLiked = userId
        ? post.likes.some((like) => like.userId === userId)
        : false;
      const likedBy = post.likes.map((like) => ({
        id: like.user.id,
        email: like.user.email,
      }));

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

    return NextResponse.json({ posts: postsWithLikes }, { status: 200 });
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

    const formData = await request.formData();
    const content = formData.get("content") as string | null;
    const imageFile = formData.get("image") as File | null;

    let imageUrl: string | undefined;

    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadsDir = join(process.cwd(), "public", "uploads", "posts");
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      const timestamp = Date.now();
      const filename = `${timestamp}-${imageFile.name}`;
      const filepath = join(uploadsDir, filename);

      await writeFile(filepath, buffer);
      imageUrl = `/uploads/posts/${filename}`;
    }

    const parsed = createPostSchema.safeParse({
      content: content?.trim() || undefined,
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

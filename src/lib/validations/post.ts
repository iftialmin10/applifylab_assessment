import { z } from "zod";

export const createPostSchema = z
  .object({
    content: z.string().optional(),
    imageUrl: z.string().optional(),
  })
  .refine(
    (data) => {
      const hasContent = data.content && data.content.trim().length > 0;
      const hasImage = data.imageUrl && data.imageUrl.length > 0;
      return hasContent || hasImage;
    },
    {
      message: "Either content or image is required",
      path: ["content"],
    }
  );

export type CreatePostSchema = z.infer<typeof createPostSchema>;

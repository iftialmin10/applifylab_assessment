import { z } from "zod";

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

export type CreateCommentSchema = z.infer<typeof createCommentSchema>;

export const createReplySchema = z.object({
  content: z.string().min(1, "Reply cannot be empty"),
});

export type CreateReplySchema = z.infer<typeof createReplySchema>;

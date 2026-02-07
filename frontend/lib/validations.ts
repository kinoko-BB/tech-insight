import { z } from "zod";

export const articleCreateSchema = z.object({
  title: z.string().min(1, "タイトルは必須です").max(255, "タイトルは255文字以内です"),
  content: z.string().min(1, "本文は必須です"),
  author: z.string().max(255).optional(),
  category: z.string().max(100).optional(),
  published_at: z.string().optional(),
});

export type ArticleCreateFormData = z.infer<typeof articleCreateSchema>;

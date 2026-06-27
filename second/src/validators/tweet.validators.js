import { z } from 'zod';

export const createTweetSchema = z.object({
  content: z.string().min(1).max(280).trim(),
  media:   z.array(z.string().url()).max(4).optional().default([])
});

export const updateTweetSchema = z.object({
  content: z.string().min(1).max(280).trim()
});

export const createReplySchema = z.object({
  content: z.string().min(1).max(280).trim()
});

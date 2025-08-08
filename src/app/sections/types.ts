
import { z } from 'zod';

export const sectionSchema = z.object({
  id: z.string(),
  rows: z.number(),
  cols: z.number(),
  isArchived: z.boolean().optional().default(false),
});

export type Section = z.infer<typeof sectionSchema>;

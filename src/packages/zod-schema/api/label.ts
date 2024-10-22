import { z } from 'zod';
export const createLabelSchema = z.object({
  name: z.string().length(1),
});

type createLabelSchema = z.infer<typeof createLabelSchema>;

import { z } from 'zod';

export const Confirm2FaDtoSchema = z.object({
  code: z.string().length(6),
});

export type Confirm2FaDto = z.infer<typeof Confirm2FaDtoSchema>;

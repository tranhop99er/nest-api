import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6),
});

export const confirm2FaSchema = z.object({
  code: z.string().length(6),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

type loginSchema = z.infer<typeof loginSchema>;
type registerSchema = z.infer<typeof registerSchema>;
type forgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
type confirm2FaSchema = z.infer<typeof confirm2FaSchema>;

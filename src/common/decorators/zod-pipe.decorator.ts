import { ZodDto, ZodValidationPipe } from 'nestjs-zod';
import { ZodSchema } from 'zod';

export const ZodPipe = (schemaOrDto?: ZodSchema | ZodDto) =>
  new ZodValidationPipe(schemaOrDto);

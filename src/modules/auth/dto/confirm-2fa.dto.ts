import { createZodDto } from 'nestjs-zod';
import { confirm2FaSchema } from 'src/packages/zod-schema';

class Confirm2FaDto extends createZodDto(confirm2FaSchema) {}

export { Confirm2FaDto };

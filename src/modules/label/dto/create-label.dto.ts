import { createZodDto } from 'nestjs-zod';
import { createLabelSchema } from 'src/packages/zod-schema';

class CreateLabelDto extends createZodDto(createLabelSchema) {}

export { CreateLabelDto };

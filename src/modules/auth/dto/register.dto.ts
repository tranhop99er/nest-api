import { createZodDto } from 'nestjs-zod';
import { registerSchema } from 'src/packages/zod-schema/api/auth';

class RegisterDto extends createZodDto(registerSchema) {}

export { RegisterDto };

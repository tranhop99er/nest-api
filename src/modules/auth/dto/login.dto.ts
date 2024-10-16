import { createZodDto } from 'nestjs-zod';
import { loginSchema } from 'src/packages/zod-schema/api/auth';

class LoginDto extends createZodDto(loginSchema) {}

export { LoginDto };

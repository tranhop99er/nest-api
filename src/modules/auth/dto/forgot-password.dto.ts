import { createZodDto } from 'nestjs-zod';
import { forgotPasswordSchema } from 'src/packages/zod-schema/api/auth';

class ForgotPasswordDto extends createZodDto(forgotPasswordSchema) {}

export { ForgotPasswordDto };

import { createZodDto } from 'nestjs-zod';
import { resetPasswordSchema } from 'src/packages/zod-schema/api/auth';

class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}

export { ResetPasswordDto };

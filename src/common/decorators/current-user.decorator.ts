import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { UserPayload } from '../strategies/jwt-payload.interface';

export const ActiveUser = createParamDecorator(
  (field: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    console.log('Cookies:', request.cookies); // Thêm dòng này để kiểm tra cookies
    const user: UserPayload | undefined = request['user'];
    return field ? user?.[field] : user;
  },
);

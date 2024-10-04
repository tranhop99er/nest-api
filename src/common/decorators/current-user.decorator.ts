import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { UserPayload } from '../strategies/jwt-payload.interface';

export const ActiveUser = createParamDecorator(
  (field: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: UserPayload | undefined = request['user'];
    return field ? user?.[field] : user;
  },
);

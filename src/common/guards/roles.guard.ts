// src/common/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject('ROLE_METADATA') private roles: Role[], // Inject the roles here
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const handlerRoles = this.reflector.get<Role[]>(
      'roles',
      context.getHandler(),
    );
    if (!handlerRoles) {
      return true; // Allow access if no roles are defined
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Assuming user is attached to the request

    // Check if the user has any of the required roles
    return (
      user &&
      (this.roles.includes(user.role) ||
        handlerRoles.some((role) => user.role === role))
    );
  }
}

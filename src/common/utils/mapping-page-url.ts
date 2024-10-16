import { Role } from '@prisma/client';

export const mappingPageUrl = {
  [Role.USER]: process.env.APP_USER_PAGE ?? 'http://localhost:3001',
  [Role.ADMIN]: process.env.APP_ADMIN_PAGE ?? 'http://localhost:3000',
};

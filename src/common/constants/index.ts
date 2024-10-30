import { Role } from '@prisma/client';

export const AUTH_OPTIONS = 'AUTH_OPTIONS';
export const MAX_FILE_SIZE = 1024 * 1024 * 10;
export const VALID_UPLOADS_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
];
export const ACCOUNT_OPTIONS = 'ACCOUNT_OPTIONS';
export const USER_ROLES = [Role.ADMIN, Role.USER];

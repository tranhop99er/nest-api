import { UserPayload } from '../strategies/jwt-payload.interface';

export type WithCurrentUser<T> = T & {
  currentUser: UserPayload;
};

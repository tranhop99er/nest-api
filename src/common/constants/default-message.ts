import { HttpStatus } from '@nestjs/common';

export const DEFAULT_MESSAGE = 'Something went wrong';
export const DEFAULT_RESPONSE = {
  message: DEFAULT_MESSAGE,
  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
};
export const NOT_FOUND_RESPONSE = {
  message: 'Not found',
  statusCode: HttpStatus.NOT_FOUND,
};

export const API_COMMON_MSG = {
  badRequest: 'Bad request',
  forbidden: 'Forbidden',
  unauthorize: 'Authorization required',
  userNotFound: 'User not found',
};

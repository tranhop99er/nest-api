import { Request, Response } from 'express';

export interface IClearCookie {
  request: Request;
  response: Response;
}

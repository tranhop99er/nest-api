import { LoginDto } from '../dto';

export interface ILogin extends LoginDto {
  userAgent: string;
}

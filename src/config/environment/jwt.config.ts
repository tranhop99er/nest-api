import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => {
  return {
    secret: process.env.JWT_SECRET,
    issuer: process.env.JWT_TOKEN_ISSUER,
    accessTokenTtl: parseInt(process.env.JWT_ACCESS_TOKEN_TTL ?? '3600', 10),
    refreshTokenTtl: parseInt(process.env.JWT_REFRESH_TOKEN_TTL ?? '86400', 10),
    // forgotPasswordTtl: parseInt(
    //   process.env.JWT_FORGOT_PASSWORD_TTL ?? '600',
    //   10,
    // ),
  };
});

export type JwtConfig = ReturnType<typeof jwtConfig>;

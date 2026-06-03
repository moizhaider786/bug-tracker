import { JwtPayload } from 'src/types/index';

declare module 'express' {
  interface Request {
    user?: JwtPayload;
  }
}

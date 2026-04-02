import type { User } from '../../common/types/user';

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}

export {};

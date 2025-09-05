import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rawbody from 'raw-body';

// Augment the Request interface to include the rawBody property
declare global {
  namespace Express {
    interface Request {
      rawBody: any;
    }
  }
}

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.headers['stripe-signature']) {
      rawbody(
        req,
        {
          length: req.headers['content-length'],
          limit: '1mb',
        },
        (err, string) => {
          if (err) return next(err);
          req.rawBody = string;
          next();
        },
      );
    } else {
      next();
    }
  }
}

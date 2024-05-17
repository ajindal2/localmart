// src/common/middleware/correlation-id.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Check if the session ID already exists
    const sessionId = req.headers['x-session-id'] || uuidv4();
    
    // Assign the correlation ID to request and response headers
    req.headers['x-session-id'] = sessionId;
    res.setHeader('x-session-id', sessionId);
    
    next();
  }
}

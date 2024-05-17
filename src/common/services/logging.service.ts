// src/common/services/logging.service.ts
import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Logger } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class LoggingService {
  private readonly request: Request;
  private logger: Logger;

  constructor(@Inject(REQUEST) request: Request) {
    this.request = request;
  }

  setContext(context: string) {
    this.logger = new Logger(context);
  }

  log(message: string) {
    const sessionId = this.request.headers['x-session-id'];
    this.logger.log(`${message} - sessionId: ${sessionId}`);
  }

  error(message: string, trace: string) {
    const sessionId = this.request.headers['x-session-id'];
    this.logger.error(`${message} - sessionId: ${sessionId}`, trace);
  }

  warn(message: string) {
    const sessionId = this.request.headers['x-session-id'];
    this.logger.warn(`${message} - sessionId: ${sessionId}`);
  }

  debug(message: string) {
    const sessionId = this.request.headers['x-session-id'];
    this.logger.debug(`${message} - sessionId: ${sessionId}`);
  }

  verbose(message: string) {
    const sessionId = this.request.headers['x-session-id'];
    this.logger.verbose(`${message} - sessionId: ${sessionId}`);
  }
}

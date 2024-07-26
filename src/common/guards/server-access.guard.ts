// server-access.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { SERVER_ACCESS_KEY } from '../decorators/server-access.decorator';

@Injectable()
export class ServerAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isServerAccessRoute = this.reflector.getAllAndOverride<boolean>(SERVER_ACCESS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isServerAccessRoute) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_TOKEN_SECRET,
      });

      if (payload.serverAccess) {
        return true;
      } else {
        throw new UnauthorizedException('Invalid server access token');
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

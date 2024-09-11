import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Token not found');
    }
    const token = authHeader.split(' ')[1];

    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      request.user = decoded;

      return true;
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      }

      throw new UnauthorizedException('Invalid token');
    }
  }
}

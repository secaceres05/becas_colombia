import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = request.headers['x-api-key'];

    if (!key || key !== process.env.SCRAPER_API_KEY) {
      throw new UnauthorizedException('API key inválida');
    }
    return true;
  }
}
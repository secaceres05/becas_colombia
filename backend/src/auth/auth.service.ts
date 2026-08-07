import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.adminUser.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('Contraseña incorrecta');

    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_SECRET!,
      expiresIn: '15m',
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET!,
      expiresIn: '7d',
    });

    await this.prisma.adminUser.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async refresh(token: string) {
    try {
      const payload = this.jwt.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET!,
      });

      const user = await this.prisma.adminUser.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.refreshToken !== token) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      const newPayload = { sub: user.id, email: user.email, role: user.role };
      const accessToken = this.jwt.sign(newPayload, {
        secret: process.env.JWT_SECRET!,
        expiresIn: '15m',
      });

      return { accessToken };
    } catch {
      throw new UnauthorizedException('Refresh token expirado o inválido');
    }
  }
}
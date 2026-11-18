import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  // Hash de una contraseña aleatoria, con los mismos parámetros que los hashes reales (seed).
  // Se verifica contra él cuando el correo no existe, para que el tiempo de respuesta no lo delate.
  private dummyHash!: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async onModuleInit() {
    this.dummyHash = await argon2.hash(randomBytes(32).toString('hex'));
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.adminUser.findUnique({
      where: { email: dto.email },
    });

    // Siempre se ejecuta un argon2.verify y siempre se responde lo mismo,
    // exista o no el correo.
    const valid = await argon2.verify(user?.passwordHash ?? this.dummyHash, dto.password);
    if (!user || !valid) throw new UnauthorizedException('Credenciales inválidas');

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
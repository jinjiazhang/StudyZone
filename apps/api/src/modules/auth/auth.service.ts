import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';

import { PrismaService } from '../../infra/prisma.service';
import { RegisterDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly events: EventEmitter2,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException({ code: 'email_taken', message: '邮箱已注册' });

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        nickname: dto.nickname,
        locale: dto.locale ?? 'zh-CN',
        wallet: { create: {} },
        streak: { create: {} },
      },
      include: { wallet: true, streak: true },
    });

    this.events.emit('account.user.registered', {
      id: cryptoRandomId(),
      type: 'account.user.registered',
      occurredAt: new Date().toISOString(),
      source: 'account',
      payload: { userId: user.id, email: user.email },
    });

    const tokens = await this.issueTokens(user.id, user.email);
    return {
      user: publicUser(user),
      tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException({ code: 'invalid_credentials', message: '邮箱或密码错误' });

    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException({ code: 'invalid_credentials', message: '邮箱或密码错误' });

    const tokens = await this.issueTokens(user.id, user.email);
    return { user: publicUser(user), tokens };
  }

  async refresh(refreshToken: string) {
    const hash = sha256(refreshToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hash },
      include: { user: true },
    });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException({ code: 'invalid_refresh', message: '刷新令牌已失效' });
    }

    // Rotate.
    await this.prisma.refreshToken.update({
      where: { tokenHash: hash },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokens(record.user.id, record.user.email);
    return { user: publicUser(record.user), tokens };
  }

  private async issueTokens(userId: string, email: string) {
    const accessTtl = Number(this.config.get('JWT_ACCESS_TTL', 900));
    const refreshTtl = Number(this.config.get('JWT_REFRESH_TTL', 2592000));

    const accessToken = await this.jwt.signAsync({ sub: userId, email });

    const refreshToken = randomBytes(48).toString('base64url');
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(Date.now() + refreshTtl * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTtl,
    };
  }
}

function sha256(input: string) {
  return createHash('sha256').update(input).digest('hex');
}

function cryptoRandomId() {
  return randomBytes(12).toString('base64url');
}

function publicUser(u: { id: string; nickname: string; avatarUrl: string | null; locale: string; createdAt: Date }) {
  return {
    id: u.id,
    nickname: u.nickname,
    avatarUrl: u.avatarUrl,
    locale: u.locale,
    createdAt: u.createdAt.toISOString(),
  };
}

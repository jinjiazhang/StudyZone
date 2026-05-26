import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/current-user.decorator';
import { SocialService } from './social.service';

class FriendRequestDto {
  @IsEmail()
  email!: string;
}

@ApiTags('social')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1')
export class SocialController {
  constructor(private readonly service: SocialService) {}

  @Get('friends')
  friends(@CurrentUser() user: AuthenticatedUser, @Query('cursor') cursor?: string) {
    return this.service.listFriends(user.id, cursor);
  }

  @Post('friends/requests')
  @HttpCode(204)
  async sendRequest(@CurrentUser() user: AuthenticatedUser, @Body() dto: FriendRequestDto) {
    await this.service.sendRequest(user.id, dto.email);
  }

  @Post('friends/:requesterId/accept')
  @HttpCode(204)
  async accept(@CurrentUser() user: AuthenticatedUser, @Param('requesterId') requesterId: string) {
    await this.service.accept(user.id, requesterId);
  }

  @Get('leagues/me')
  league(@CurrentUser() user: AuthenticatedUser) {
    return this.service.myLeague(user.id);
  }
}

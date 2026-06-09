import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/current-user.decorator';
import { SocialService } from './social.service';

@ApiTags('social')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1')
export class SocialController {
  constructor(private readonly service: SocialService) {}

  // NOTE: static `users/...` routes must precede the `users/:id` param route so
  // they are not swallowed by it.
  @Get('users/username-available')
  usernameAvailable(@Query('u') username: string) {
    return this.service.usernameAvailable(username ?? '');
  }

  @Get('users')
  search(
    @CurrentUser() user: AuthenticatedUser,
    @Query('search') search?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.service.searchUsers(user.id, search ?? '', cursor);
  }

  @Get('me/following')
  following(@CurrentUser() user: AuthenticatedUser, @Query('cursor') cursor?: string) {
    return this.service.listFollowing(user.id, cursor);
  }

  @Get('me/followers')
  followers(@CurrentUser() user: AuthenticatedUser, @Query('cursor') cursor?: string) {
    return this.service.listFollowers(user.id, cursor);
  }

  @Get('users/:id')
  profile(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.getPublicProfile(user.id, id);
  }

  @Post('users/:id/follow')
  @HttpCode(204)
  async follow(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.service.follow(user.id, id);
  }

  @Delete('users/:id/follow')
  @HttpCode(204)
  async unfollow(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.service.unfollow(user.id, id);
  }
}

import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/current-user.decorator';
import { GamificationService } from './gamification.service';

@ApiTags('gamification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/quests')
export class GamificationController {
  constructor(private readonly service: GamificationService) {}

  @Get('daily')
  daily(@CurrentUser() user: AuthenticatedUser) {
    return this.service.dailyQuests(user.id);
  }
}

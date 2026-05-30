import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/current-user.decorator';
import { QuestsService } from './quests.service';

@ApiTags('quests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/quests')
export class QuestsController {
  constructor(private readonly service: QuestsService) {}

  @Get('daily')
  daily(@CurrentUser() user: AuthenticatedUser) {
    return this.service.dailyQuests(user.id);
  }
}

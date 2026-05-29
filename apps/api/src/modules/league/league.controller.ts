import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/current-user.decorator';
import { LeagueService } from './league.service';

class SettleLeaguesBody {
  weekStart?: string;
}

@ApiTags('league')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1')
export class LeagueController {
  constructor(private readonly service: LeagueService) {}

  @Get('leagues/me')
  myLeague(@CurrentUser() user: AuthenticatedUser) {
    return this.service.myLeague(user.id);
  }

  @Get('leagues/history')
  history(@CurrentUser() user: AuthenticatedUser) {
    return this.service.history(user.id);
  }

  // --- Admin ---

  @Get('admin/leagues')
  adminListWeek(@Query('weekStart') weekStart?: string) {
    return this.service.adminListWeek(weekStart);
  }

  @Post('admin/leagues/settle')
  adminSettle(@Body() body: SettleLeaguesBody) {
    return body?.weekStart
      ? this.service.settleWeek(new Date(body.weekStart))
      : this.service.settlePreviousWeek();
  }
}

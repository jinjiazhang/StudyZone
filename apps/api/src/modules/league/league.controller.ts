import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/current-user.decorator';
import { LeagueService } from './league.service';

class SettleLeaguesBody {
  @IsOptional()
  @IsDateString()
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

  @Get('admin/leagues/weeks')
  adminListWeeks() {
    return this.service.adminListWeeks();
  }

  @Get('admin/leagues/:id')
  async adminGetGroup(@Param('id') id: string) {
    const group = await this.service.adminGetGroup(id);
    if (!group) {
      throw new NotFoundException({ code: 'league_group_not_found', message: '联赛分组不存在' });
    }
    return group;
  }

  @Post('admin/leagues/settle')
  adminSettle(@Body() body: SettleLeaguesBody) {
    return body?.weekStart
      ? this.service.settleWeek(new Date(body.weekStart))
      : this.service.settlePreviousWeek();
  }
}

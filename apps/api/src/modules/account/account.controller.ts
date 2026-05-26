import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min, MaxLength } from 'class-validator';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/current-user.decorator';
import { AccountService } from './account.service';

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  nickname?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  dailyGoalMinutes?: number;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

@ApiTags('me')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/me')
export class AccountController {
  constructor(private readonly service: AccountService) {}

  @Get()
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getProfile(user.id);
  }

  @Patch()
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.service.updateProfile(user.id, dto);
  }
}

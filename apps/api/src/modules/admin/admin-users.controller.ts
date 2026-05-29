import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { AdminUsersService } from './admin-users.service';
import { AdjustWalletDto, ListUsersQueryDto, UpdateUserDto } from './admin-users.dto';

@ApiTags('admin-users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/admin/users')
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get()
  list(@Query() query: ListUsersQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/wallet')
  adjustWallet(@Param('id') id: string, @Body() dto: AdjustWalletDto) {
    return this.service.adjustWallet(id, dto);
  }
}

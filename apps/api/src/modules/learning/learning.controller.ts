import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/current-user.decorator';
import { LearningService } from './learning.service';
import { SubmitAttemptDto, CompleteSessionDto } from './learning.dto';

@ApiTags('learning')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1')
export class LearningController {
  constructor(private readonly service: LearningService) {}

  @Post('lessons/:id/start')
  @HttpCode(200)
  start(@CurrentUser() user: AuthenticatedUser, @Param('id') lessonId: string) {
    return this.service.startLesson(user.id, lessonId);
  }

  @Post('sessions/:id/attempts')
  @HttpCode(200)
  attempt(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') sessionId: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.service.submitAttempt(user.id, sessionId, dto);
  }

  @Post('sessions/:id/complete')
  @HttpCode(200)
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') sessionId: string,
    @Body() dto: CompleteSessionDto,
  ) {
    return this.service.completeSession(user.id, sessionId, dto);
  }
}

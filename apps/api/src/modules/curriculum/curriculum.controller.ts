import {
  Controller,
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
import { CurriculumService } from './curriculum.service';

@ApiTags('curriculum')
@Controller('api/v1')
export class CurriculumController {
  constructor(private readonly service: CurriculumService) {}

  @Get('subjects')
  subjects() {
    return this.service.listSubjects();
  }

  @Get('courses')
  courses(@Query('subject') subject?: string) {
    return this.service.listCourses(subject);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('courses/:id/enroll')
  @HttpCode(204)
  async enroll(@CurrentUser() user: AuthenticatedUser, @Param('id') courseId: string) {
    await this.service.enroll(user.id, courseId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('courses/:id/tree')
  tree(@CurrentUser() user: AuthenticatedUser, @Param('id') courseId: string) {
    return this.service.getCourseTree(user.id, courseId);
  }

  @Get('skills/:id/first-lesson')
  firstLesson(@Param('id') skillId: string) {
    return this.service.firstLessonOfSkill(skillId);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Lesson } from '../users/entities/lesson.entity';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get('lessons')
  @Roles(UserRole.ADMIN)
  async getAllLessons(): Promise<Lesson[]> {
    return this.lessonsService.findAll();
  }

  @Post('lesson')
  @HttpCode(HttpStatus.CREATED)
  async createLesson(
    @Body() createLessonDto: CreateLessonDto,
    @CurrentUser() user: any,
  ): Promise<Lesson> {
    return this.lessonsService.create(createLessonDto, user.role);
  }

  @Post('lesson/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approveLesson(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<Lesson> {
    // Get the lesson to check the teacherId
    const lesson = await this.lessonsService.findOne(id);

    // Check authorization: admin or teacher with same ID
    if (user.role === UserRole.ADMIN) {
      return this.lessonsService.approve(id);
    }

    if (user.role === UserRole.TEACHER && user.userId === lesson.teacherId) {
      return this.lessonsService.approve(id);
    }

    throw new ForbiddenException(
      'You can only approve your own lessons or be an admin',
    );
  }

  @Get('students/:id/lessons')
  async getStudentLessons(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<Lesson[]> {
    // Check authorization: admin or student with same ID
    if (user.role !== UserRole.ADMIN && user.userId !== id) {
      throw new ForbiddenException('You can only view your own lessons');
    }

    return this.lessonsService.findByStudent(id);
  }

  @Get('teachers/:id/lessons')
  async getTeacherLessons(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<Lesson[]> {
    // Check authorization: admin or teacher with same ID
    if (user.role !== UserRole.ADMIN && user.userId !== id) {
      throw new ForbiddenException('You can only view your own lessons');
    }

    return this.lessonsService.findByTeacher(id);
  }
}


import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentsService } from './students.service';
import { CreateStudentDto } from '../users/dto/create-student.dto';
import { UpdateStudentDto } from '../users/dto/update-student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Student } from '../users/entities/student.entity';
import { Lesson } from '../users/entities/lesson.entity';

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    @InjectRepository(Lesson)
    private lessonsRepository: Repository<Lesson>,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createStudentDto: CreateStudentDto): Promise<Student> {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  findAll(): Promise<Student[]> {
    return this.studentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Student> {
    return this.studentsService.findOne(id);
  }

  @Post(':id')
  async updateViaPost(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @CurrentUser() user: any,
  ): Promise<Student> {
    // Check if user is admin
    if (user.role === UserRole.ADMIN) {
      return this.studentsService.update(id, updateStudentDto);
    }

    // Check if user is a teacher who has lessons with this student
    if (user.role === UserRole.TEACHER) {
      const hasLessonWithStudent = await this.lessonsRepository.findOne({
        where: {
          teacherId: user.userId,
          studentId: id,
        },
      });

      if (hasLessonWithStudent) {
        return this.studentsService.update(id, updateStudentDto);
      }
    }

    throw new ForbiddenException('You can only update students you teach');
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.studentsService.remove(id);
  }
}


import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { CreateTeacherDto } from '../users/dto/create-teacher.dto';
import { UpdateTeacherDto } from '../users/dto/update-teacher.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Teacher } from '../users/entities/teacher.entity';
import { Student } from '../users/entities/student.entity';

@Controller('teachers')
@UseGuards(JwtAuthGuard)
export class TeachersController {
  constructor(
    private readonly teachersService: TeachersService,
    private readonly assignmentsService: AssignmentsService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTeacherDto: CreateTeacherDto): Promise<Teacher> {
    return this.teachersService.create(createTeacherDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll(): Promise<Teacher[]> {
    return this.teachersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Teacher> {
    return this.teachersService.findOne(id);
  }

  @Get(':id/students')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async getStudents(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<Student[]> {
    // Check if user is admin or the same teacher
    if (user.role !== UserRole.ADMIN && user.userId !== id) {
      throw new ForbiddenException('You can only view your own students');
    }

    return this.assignmentsService.findStudentsByTeacher(id);
  }

  @Post(':id')
  async updateViaPost(
    @Param('id') id: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
    @CurrentUser() user: any,
  ): Promise<Teacher> {
    // Check if user is admin or the same teacher
    if (user.role !== UserRole.ADMIN && user.userId !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    return this.teachersService.update(id, updateTeacherDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
    @CurrentUser() user: any,
  ): Promise<Teacher> {
    // Check if user is admin or the same teacher
    if (user.role !== UserRole.ADMIN && user.userId !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    return this.teachersService.update(id, updateTeacherDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.teachersService.remove(id);
  }
}


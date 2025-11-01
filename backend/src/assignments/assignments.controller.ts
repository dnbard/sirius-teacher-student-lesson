import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from '../users/dto/create-assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Assignment } from '../users/entities/assignment.entity';

@Controller('assignments')
@UseGuards(JwtAuthGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createAssignmentDto: CreateAssignmentDto,
    @CurrentUser() user: any,
  ): Promise<Assignment> {
    // If not admin, verify teacher is creating assignment for themselves
    if (user.role === UserRole.TEACHER && user.userId !== createAssignmentDto.teacherId) {
      throw new ForbiddenException('Teachers can only create assignments for themselves');
    }

    return this.assignmentsService.create(createAssignmentDto);
  }
}


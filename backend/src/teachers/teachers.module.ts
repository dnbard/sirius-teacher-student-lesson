import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teacher } from '../users/entities/teacher.entity';
import { User } from '../users/entities/user.entity';
import { Assignment } from '../users/entities/assignment.entity';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';
import { AssignmentsModule } from '../assignments/assignments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Teacher, User, Assignment]),
    AssignmentsModule,
  ],
  controllers: [TeachersController],
  providers: [TeachersService],
  exports: [TeachersService],
})
export class TeachersModule {}


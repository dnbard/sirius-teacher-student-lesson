import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { Lesson } from '../users/entities/lesson.entity';
import { Teacher } from '../users/entities/teacher.entity';
import { Student } from '../users/entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lesson, Teacher, Student])],
  controllers: [LessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}


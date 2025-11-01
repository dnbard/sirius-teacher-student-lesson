import { IsEnum, IsNotEmpty, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { LessonStatus } from '../entities/lesson.entity';

export class CreateLessonDto {
  @IsUUID()
  @IsNotEmpty()
  teacherId: string;

  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @IsEnum(LessonStatus)
  @IsOptional()
  status?: LessonStatus;
}


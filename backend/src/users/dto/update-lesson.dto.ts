import { IsEnum, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { LessonStatus } from '../entities/lesson.entity';

export class UpdateLessonDto {
  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @IsUUID()
  @IsOptional()
  studentId?: string;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsEnum(LessonStatus)
  @IsOptional()
  status?: LessonStatus;
}


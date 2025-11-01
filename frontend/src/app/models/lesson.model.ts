import { Teacher } from './teacher.model';
import { Student } from './student.model';

export enum LessonStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Lesson {
  id: string;
  teacherId: string;
  teacher: Teacher;
  studentId: string;
  student: Student;
  startTime: string;
  endTime: string;
  status: LessonStatus;
}


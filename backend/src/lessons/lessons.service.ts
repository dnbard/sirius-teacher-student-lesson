import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson, LessonStatus } from '../users/entities/lesson.entity';
import { Teacher } from '../users/entities/teacher.entity';
import { Student } from '../users/entities/student.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private lessonsRepository: Repository<Lesson>,
    @InjectRepository(Teacher)
    private teachersRepository: Repository<Teacher>,
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
  ) {}

  async create(createLessonDto: CreateLessonDto, userRole: UserRole): Promise<Lesson> {
    const { teacherId, studentId, startTime, endTime } = createLessonDto;

    // Validate that teacher exists
    const teacher = await this.teachersRepository.findOne({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    }

    // Validate that student exists
    const student = await this.studentsRepository.findOne({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    // Validate time range
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      throw new BadRequestException('End time must be after start time');
    }

    // Determine status based on user role
    let status: LessonStatus;
    if (userRole === UserRole.TEACHER) {
      status = LessonStatus.APPROVED;
    } else if (userRole === UserRole.ADMIN || userRole === UserRole.STUDENT) {
      status = LessonStatus.PENDING;
    } else {
      status = LessonStatus.PENDING;
    }

    const lesson = this.lessonsRepository.create({
      teacherId,
      studentId,
      startTime: start,
      endTime: end,
      status,
    });

    return this.lessonsRepository.save(lesson);
  }

  async approve(id: string): Promise<Lesson> {
    const lesson = await this.lessonsRepository.findOne({
      where: { id },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    lesson.status = LessonStatus.APPROVED;
    return this.lessonsRepository.save(lesson);
  }

  async findByStudent(studentId: string): Promise<Lesson[]> {
    // Validate that student exists
    const student = await this.studentsRepository.findOne({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    return this.lessonsRepository.find({
      where: { studentId },
      relations: ['teacher', 'student'],
      order: { startTime: 'DESC' },
    });
  }

  async findByTeacher(teacherId: string): Promise<Lesson[]> {
    // Validate that teacher exists
    const teacher = await this.teachersRepository.findOne({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    }

    return this.lessonsRepository.find({
      where: { teacherId },
      relations: ['teacher', 'student'],
      order: { startTime: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Lesson> {
    const lesson = await this.lessonsRepository.findOne({
      where: { id },
      relations: ['teacher', 'student'],
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    return lesson;
  }

  async findAll(): Promise<Lesson[]> {
    return this.lessonsRepository.find({
      relations: ['teacher', 'student', 'teacher.user', 'student.user'],
      order: { startTime: 'DESC' },
    });
  }
}


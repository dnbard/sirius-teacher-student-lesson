import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LessonsService } from './lessons.service';
import { Lesson, LessonStatus } from '../users/entities/lesson.entity';
import { Teacher } from '../users/entities/teacher.entity';
import { Student } from '../users/entities/student.entity';
import { UserRole } from '../users/entities/user.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('LessonsService', () => {
  let service: LessonsService;

  const mockLessonsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockTeachersRepository = {
    findOne: jest.fn(),
  };

  const mockStudentsRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonsService,
        {
          provide: getRepositoryToken(Lesson),
          useValue: mockLessonsRepository,
        },
        {
          provide: getRepositoryToken(Teacher),
          useValue: mockTeachersRepository,
        },
        {
          provide: getRepositoryToken(Student),
          useValue: mockStudentsRepository,
        },
      ],
    }).compile();

    service = module.get<LessonsService>(LessonsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createLessonDto = {
      teacherId: 'teacher-id',
      studentId: 'student-id',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T11:00:00Z',
    };

    const mockTeacher = { id: 'teacher-id' } as Teacher;
    const mockStudent = { id: 'student-id' } as Student;

    it('should create a lesson with APPROVED status for teacher role', async () => {
      mockTeachersRepository.findOne.mockResolvedValue(mockTeacher);
      mockStudentsRepository.findOne.mockResolvedValue(mockStudent);

      const mockLesson = {
        id: 'lesson-id',
        teacherId: createLessonDto.teacherId,
        studentId: createLessonDto.studentId,
        startTime: new Date(createLessonDto.startTime),
        endTime: new Date(createLessonDto.endTime),
        status: LessonStatus.APPROVED,
        teacher: mockTeacher,
        student: mockStudent,
      } as Lesson;

      mockLessonsRepository.create.mockReturnValue(mockLesson);
      mockLessonsRepository.save.mockResolvedValue(mockLesson);

      const result = await service.create(createLessonDto, UserRole.TEACHER);

      expect(result.status).toBe(LessonStatus.APPROVED);
      expect(mockLessonsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: LessonStatus.APPROVED,
        }),
      );
    });

    it('should create a lesson with PENDING status for student role', async () => {
      mockTeachersRepository.findOne.mockResolvedValue(mockTeacher);
      mockStudentsRepository.findOne.mockResolvedValue(mockStudent);

      const mockLesson = {
        id: 'lesson-id',
        teacherId: createLessonDto.teacherId,
        studentId: createLessonDto.studentId,
        startTime: new Date(createLessonDto.startTime),
        endTime: new Date(createLessonDto.endTime),
        status: LessonStatus.PENDING,
        teacher: mockTeacher,
        student: mockStudent,
      } as Lesson;

      mockLessonsRepository.create.mockReturnValue(mockLesson);
      mockLessonsRepository.save.mockResolvedValue(mockLesson);

      const result = await service.create(createLessonDto, UserRole.STUDENT);

      expect(result.status).toBe(LessonStatus.PENDING);
      expect(mockLessonsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: LessonStatus.PENDING,
        }),
      );
    });

    it('should create a lesson with PENDING status for admin role', async () => {
      mockTeachersRepository.findOne.mockResolvedValue(mockTeacher);
      mockStudentsRepository.findOne.mockResolvedValue(mockStudent);

      const mockLesson = {
        id: 'lesson-id',
        teacherId: createLessonDto.teacherId,
        studentId: createLessonDto.studentId,
        startTime: new Date(createLessonDto.startTime),
        endTime: new Date(createLessonDto.endTime),
        status: LessonStatus.PENDING,
        teacher: mockTeacher,
        student: mockStudent,
      } as Lesson;

      mockLessonsRepository.create.mockReturnValue(mockLesson);
      mockLessonsRepository.save.mockResolvedValue(mockLesson);

      const result = await service.create(createLessonDto, UserRole.ADMIN);

      expect(result.status).toBe(LessonStatus.PENDING);
      expect(mockLessonsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: LessonStatus.PENDING,
        }),
      );
    });

    it('should throw NotFoundException if teacher does not exist', async () => {
      mockTeachersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(createLessonDto, UserRole.TEACHER),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if student does not exist', async () => {
      mockTeachersRepository.findOne.mockResolvedValue(mockTeacher);
      mockStudentsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(createLessonDto, UserRole.TEACHER),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if end time is before start time', async () => {
      mockTeachersRepository.findOne.mockResolvedValue(mockTeacher);
      mockStudentsRepository.findOne.mockResolvedValue(mockStudent);

      const invalidDto = {
        ...createLessonDto,
        startTime: '2024-01-01T11:00:00Z',
        endTime: '2024-01-01T10:00:00Z',
      };

      await expect(
        service.create(invalidDto, UserRole.TEACHER),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approve', () => {
    it('should approve a lesson', async () => {
      const mockLesson = {
        id: 'lesson-id',
        status: LessonStatus.PENDING,
      } as Lesson;

      mockLessonsRepository.findOne.mockResolvedValue(mockLesson);
      mockLessonsRepository.save.mockResolvedValue({
        ...mockLesson,
        status: LessonStatus.APPROVED,
      });

      const result = await service.approve('lesson-id');

      expect(result.status).toBe(LessonStatus.APPROVED);
      expect(mockLessonsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: LessonStatus.APPROVED,
        }),
      );
    });

    it('should throw NotFoundException if lesson does not exist', async () => {
      mockLessonsRepository.findOne.mockResolvedValue(null);

      await expect(service.approve('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByStudent', () => {
    it('should return lessons for a student', async () => {
      const mockStudent = { id: 'student-id' } as Student;
      const mockLessons = [
        { id: 'lesson-1', studentId: 'student-id' },
        { id: 'lesson-2', studentId: 'student-id' },
      ] as Lesson[];

      mockStudentsRepository.findOne.mockResolvedValue(mockStudent);
      mockLessonsRepository.find.mockResolvedValue(mockLessons);

      const result = await service.findByStudent('student-id');

      expect(result).toEqual(mockLessons);
      expect(mockLessonsRepository.find).toHaveBeenCalledWith({
        where: { studentId: 'student-id' },
        relations: ['teacher', 'student'],
        order: { startTime: 'DESC' },
      });
    });

    it('should throw NotFoundException if student does not exist', async () => {
      mockStudentsRepository.findOne.mockResolvedValue(null);

      await expect(service.findByStudent('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByTeacher', () => {
    it('should return lessons for a teacher', async () => {
      const mockTeacher = { id: 'teacher-id' } as Teacher;
      const mockLessons = [
        { id: 'lesson-1', teacherId: 'teacher-id' },
        { id: 'lesson-2', teacherId: 'teacher-id' },
      ] as Lesson[];

      mockTeachersRepository.findOne.mockResolvedValue(mockTeacher);
      mockLessonsRepository.find.mockResolvedValue(mockLessons);

      const result = await service.findByTeacher('teacher-id');

      expect(result).toEqual(mockLessons);
      expect(mockLessonsRepository.find).toHaveBeenCalledWith({
        where: { teacherId: 'teacher-id' },
        relations: ['teacher', 'student'],
        order: { startTime: 'DESC' },
      });
    });

    it('should throw NotFoundException if teacher does not exist', async () => {
      mockTeachersRepository.findOne.mockResolvedValue(null);

      await expect(service.findByTeacher('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});


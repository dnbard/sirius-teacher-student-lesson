import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UserRole } from '../users/entities/user.entity';
import { Lesson, LessonStatus } from '../users/entities/lesson.entity';

describe('LessonsController', () => {
  let controller: LessonsController;
  let service: LessonsService;

  const mockLessonsService = {
    create: jest.fn(),
    approve: jest.fn(),
    findByStudent: jest.fn(),
    findByTeacher: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LessonsController],
      providers: [
        {
          provide: LessonsService,
          useValue: mockLessonsService,
        },
      ],
    }).compile();

    controller = module.get<LessonsController>(LessonsController);
    service = module.get<LessonsService>(LessonsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createLesson', () => {
    const createLessonDto: CreateLessonDto = {
      teacherId: 'teacher-id',
      studentId: 'student-id',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T11:00:00Z',
    };

    it('should create a lesson', async () => {
      const mockUser = { userId: 'user-id', role: UserRole.TEACHER };
      const mockLesson = {
        id: 'lesson-id',
        teacherId: createLessonDto.teacherId,
        studentId: createLessonDto.studentId,
        startTime: new Date(createLessonDto.startTime),
        endTime: new Date(createLessonDto.endTime),
        status: LessonStatus.APPROVED,
      } as Partial<Lesson>;

      mockLessonsService.create.mockResolvedValue(mockLesson as Lesson);

      const result = await controller.createLesson(createLessonDto, mockUser);

      expect(result).toEqual(mockLesson);
      expect(service.create).toHaveBeenCalledWith(
        createLessonDto,
        UserRole.TEACHER,
      );
    });
  });

  describe('approveLesson', () => {
    const mockLesson = {
      id: 'lesson-id',
      teacherId: 'teacher-id',
      status: LessonStatus.PENDING,
    } as Partial<Lesson>;

    it('should allow admin to approve any lesson', async () => {
      const mockUser = { userId: 'admin-id', role: UserRole.ADMIN };
      const approvedLesson = { ...mockLesson, status: LessonStatus.APPROVED } as Partial<Lesson>;

      mockLessonsService.findOne.mockResolvedValue(mockLesson as Lesson);
      mockLessonsService.approve.mockResolvedValue(approvedLesson as Lesson);

      const result = await controller.approveLesson('lesson-id', mockUser);

      expect(result).toEqual(approvedLesson);
      expect(service.approve).toHaveBeenCalledWith('lesson-id');
    });

    it('should allow teacher to approve their own lesson', async () => {
      const mockUser = { userId: 'teacher-id', role: UserRole.TEACHER };
      const approvedLesson = { ...mockLesson, status: LessonStatus.APPROVED } as Partial<Lesson>;

      mockLessonsService.findOne.mockResolvedValue(mockLesson as Lesson);
      mockLessonsService.approve.mockResolvedValue(approvedLesson as Lesson);

      const result = await controller.approveLesson('lesson-id', mockUser);

      expect(result).toEqual(approvedLesson);
      expect(service.approve).toHaveBeenCalledWith('lesson-id');
    });

    it('should throw ForbiddenException if teacher tries to approve another teacher\'s lesson', async () => {
      const mockUser = { userId: 'other-teacher-id', role: UserRole.TEACHER };

      mockLessonsService.findOne.mockResolvedValue(mockLesson as Lesson);

      await expect(
        controller.approveLesson('lesson-id', mockUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if student tries to approve a lesson', async () => {
      const mockUser = { userId: 'student-id', role: UserRole.STUDENT };

      mockLessonsService.findOne.mockResolvedValue(mockLesson as Lesson);

      await expect(
        controller.approveLesson('lesson-id', mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getStudentLessons', () => {
    const mockLessons = [
      { id: 'lesson-1', studentId: 'student-id' },
      { id: 'lesson-2', studentId: 'student-id' },
    ] as Partial<Lesson>[];

    it('should allow admin to get any student\'s lessons', async () => {
      const mockUser = { userId: 'admin-id', role: UserRole.ADMIN };

      mockLessonsService.findByStudent.mockResolvedValue(mockLessons as Lesson[]);

      const result = await controller.getStudentLessons('student-id', mockUser);

      expect(result).toEqual(mockLessons);
      expect(service.findByStudent).toHaveBeenCalledWith('student-id');
    });

    it('should allow student to get their own lessons', async () => {
      const mockUser = { userId: 'student-id', role: UserRole.STUDENT };

      mockLessonsService.findByStudent.mockResolvedValue(mockLessons as Lesson[]);

      const result = await controller.getStudentLessons('student-id', mockUser);

      expect(result).toEqual(mockLessons);
      expect(service.findByStudent).toHaveBeenCalledWith('student-id');
    });

    it('should throw ForbiddenException if student tries to get another student\'s lessons', async () => {
      const mockUser = { userId: 'other-student-id', role: UserRole.STUDENT };

      await expect(
        controller.getStudentLessons('student-id', mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getTeacherLessons', () => {
    const mockLessons = [
      { id: 'lesson-1', teacherId: 'teacher-id' },
      { id: 'lesson-2', teacherId: 'teacher-id' },
    ] as Partial<Lesson>[];

    it('should allow admin to get any teacher\'s lessons', async () => {
      const mockUser = { userId: 'admin-id', role: UserRole.ADMIN };

      mockLessonsService.findByTeacher.mockResolvedValue(mockLessons as Lesson[]);

      const result = await controller.getTeacherLessons('teacher-id', mockUser);

      expect(result).toEqual(mockLessons);
      expect(service.findByTeacher).toHaveBeenCalledWith('teacher-id');
    });

    it('should allow teacher to get their own lessons', async () => {
      const mockUser = { userId: 'teacher-id', role: UserRole.TEACHER };

      mockLessonsService.findByTeacher.mockResolvedValue(mockLessons as Lesson[]);

      const result = await controller.getTeacherLessons('teacher-id', mockUser);

      expect(result).toEqual(mockLessons);
      expect(service.findByTeacher).toHaveBeenCalledWith('teacher-id');
    });

    it('should throw ForbiddenException if teacher tries to get another teacher\'s lessons', async () => {
      const mockUser = { userId: 'other-teacher-id', role: UserRole.TEACHER };

      await expect(
        controller.getTeacherLessons('teacher-id', mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});


import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { CreateStudentDto } from '../users/dto/create-student.dto';
import { UpdateStudentDto } from '../users/dto/update-student.dto';
import { UserRole } from '../users/entities/user.entity';
import { Student } from '../users/entities/student.entity';
import { Lesson } from '../users/entities/lesson.entity';

describe('StudentsController', () => {
  let controller: StudentsController;
  let service: StudentsService;
  let lessonsRepository: Repository<Lesson>;

  const mockStudent: Student = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    instrument: 'Piano',
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      password: 'hashedPassword',
      role: UserRole.STUDENT,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockStudentsService = {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockLessonsRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [
        {
          provide: StudentsService,
          useValue: mockStudentsService,
        },
        {
          provide: getRepositoryToken(Lesson),
          useValue: mockLessonsRepository,
        },
      ],
    }).compile();

    controller = module.get<StudentsController>(StudentsController);
    service = module.get<StudentsService>(StudentsService);
    lessonsRepository = module.get<Repository<Lesson>>(getRepositoryToken(Lesson));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createStudentDto: CreateStudentDto = {
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      password: 'password123',
      instrument: 'Piano',
    };

    it('should create a student', async () => {
      mockStudentsService.create.mockResolvedValue(mockStudent);

      const result = await controller.create(createStudentDto);

      expect(result).toEqual(mockStudent);
      expect(service.create).toHaveBeenCalledWith(createStudentDto);
    });
  });

  describe('findOne', () => {
    it('should return a student', async () => {
      mockStudentsService.findOne.mockResolvedValue(mockStudent);

      const result = await controller.findOne(mockStudent.id);

      expect(result).toEqual(mockStudent);
      expect(service.findOne).toHaveBeenCalledWith(mockStudent.id);
    });
  });

  describe('updateViaPost', () => {
    const updateStudentDto: UpdateStudentDto = {
      firstName: 'Jane',
      instrument: 'Guitar',
    };

    it('should update student when user is admin', async () => {
      const adminUser = {
        userId: 'admin-id',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      };

      mockStudentsService.update.mockResolvedValue({
        ...mockStudent,
        ...updateStudentDto,
      });

      const result = await controller.updateViaPost(mockStudent.id, updateStudentDto, adminUser);

      expect(result).toBeDefined();
      expect(service.update).toHaveBeenCalledWith(mockStudent.id, updateStudentDto);
    });

    it('should update student when user is a teacher with lessons', async () => {
      const teacherId = 'teacher-id';
      const teacherUser = {
        userId: teacherId,
        email: 'teacher@example.com',
        role: UserRole.TEACHER,
      };

      const mockLesson = {
        id: 'lesson-id',
        teacherId: teacherId,
        studentId: mockStudent.id,
      };

      mockLessonsRepository.findOne.mockResolvedValue(mockLesson);
      mockStudentsService.update.mockResolvedValue({
        ...mockStudent,
        ...updateStudentDto,
      });

      const result = await controller.updateViaPost(mockStudent.id, updateStudentDto, teacherUser);

      expect(result).toBeDefined();
      expect(lessonsRepository.findOne).toHaveBeenCalledWith({
        where: {
          teacherId: teacherId,
          studentId: mockStudent.id,
        },
      });
      expect(service.update).toHaveBeenCalledWith(mockStudent.id, updateStudentDto);
    });

    it('should throw ForbiddenException when teacher has no lessons with student', async () => {
      const teacherId = 'teacher-id';
      const teacherUser = {
        userId: teacherId,
        email: 'teacher@example.com',
        role: UserRole.TEACHER,
      };

      mockLessonsRepository.findOne.mockResolvedValue(null);

      await expect(
        controller.updateViaPost(mockStudent.id, updateStudentDto, teacherUser),
      ).rejects.toThrow(ForbiddenException);

      expect(service.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is a student', async () => {
      const studentUser = {
        userId: 'student-id',
        email: 'student@example.com',
        role: UserRole.STUDENT,
      };

      await expect(
        controller.updateViaPost(mockStudent.id, updateStudentDto, studentUser),
      ).rejects.toThrow(ForbiddenException);

      expect(service.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a student', async () => {
      mockStudentsService.remove.mockResolvedValue(undefined);

      await controller.remove(mockStudent.id);

      expect(service.remove).toHaveBeenCalledWith(mockStudent.id);
    });
  });
});


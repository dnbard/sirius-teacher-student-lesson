import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from '../users/dto/create-teacher.dto';
import { UpdateTeacherDto } from '../users/dto/update-teacher.dto';
import { UserRole } from '../users/entities/user.entity';
import { Teacher } from '../users/entities/teacher.entity';

describe('TeachersController', () => {
  let controller: TeachersController;
  let service: TeachersService;

  const mockTeacher: Teacher = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    instrument: 'Piano',
    experience: 5,
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'hashedPassword',
      role: UserRole.TEACHER,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockTeachersService = {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeachersController],
      providers: [
        {
          provide: TeachersService,
          useValue: mockTeachersService,
        },
      ],
    }).compile();

    controller = module.get<TeachersController>(TeachersController);
    service = module.get<TeachersService>(TeachersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createTeacherDto: CreateTeacherDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      instrument: 'Piano',
      experience: 5,
    };

    it('should create a teacher', async () => {
      mockTeachersService.create.mockResolvedValue(mockTeacher);

      const result = await controller.create(createTeacherDto);

      expect(result).toEqual(mockTeacher);
      expect(service.create).toHaveBeenCalledWith(createTeacherDto);
    });
  });

  describe('findOne', () => {
    it('should return a teacher', async () => {
      mockTeachersService.findOne.mockResolvedValue(mockTeacher);

      const result = await controller.findOne(mockTeacher.id);

      expect(result).toEqual(mockTeacher);
      expect(service.findOne).toHaveBeenCalledWith(mockTeacher.id);
    });
  });

  describe('updateViaPost', () => {
    const updateTeacherDto: UpdateTeacherDto = {
      firstName: 'Jane',
      instrument: 'Guitar',
    };

    it('should update teacher when user is admin', async () => {
      const adminUser = {
        userId: 'admin-id',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      };

      mockTeachersService.update.mockResolvedValue({
        ...mockTeacher,
        ...updateTeacherDto,
      });

      const result = await controller.updateViaPost(mockTeacher.id, updateTeacherDto, adminUser);

      expect(result).toBeDefined();
      expect(service.update).toHaveBeenCalledWith(mockTeacher.id, updateTeacherDto);
    });

    it('should update teacher when user is the same teacher', async () => {
      const teacherUser = {
        userId: mockTeacher.id,
        email: 'john@example.com',
        role: UserRole.TEACHER,
      };

      mockTeachersService.update.mockResolvedValue({
        ...mockTeacher,
        ...updateTeacherDto,
      });

      const result = await controller.updateViaPost(mockTeacher.id, updateTeacherDto, teacherUser);

      expect(result).toBeDefined();
      expect(service.update).toHaveBeenCalledWith(mockTeacher.id, updateTeacherDto);
    });

    it('should throw ForbiddenException when user is different teacher', async () => {
      const differentTeacherUser = {
        userId: 'different-teacher-id',
        email: 'different@example.com',
        role: UserRole.TEACHER,
      };

      await expect(
        controller.updateViaPost(mockTeacher.id, updateTeacherDto, differentTeacherUser),
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
        controller.updateViaPost(mockTeacher.id, updateTeacherDto, studentUser),
      ).rejects.toThrow(ForbiddenException);

      expect(service.update).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateTeacherDto: UpdateTeacherDto = {
      firstName: 'Jane',
      instrument: 'Guitar',
    };

    it('should update teacher via PATCH when user is admin', async () => {
      const adminUser = {
        userId: 'admin-id',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      };

      mockTeachersService.update.mockResolvedValue({
        ...mockTeacher,
        ...updateTeacherDto,
      });

      const result = await controller.update(mockTeacher.id, updateTeacherDto, adminUser);

      expect(result).toBeDefined();
      expect(service.update).toHaveBeenCalledWith(mockTeacher.id, updateTeacherDto);
    });

    it('should update teacher via PATCH when user is the same teacher', async () => {
      const teacherUser = {
        userId: mockTeacher.id,
        email: 'john@example.com',
        role: UserRole.TEACHER,
      };

      mockTeachersService.update.mockResolvedValue({
        ...mockTeacher,
        ...updateTeacherDto,
      });

      const result = await controller.update(mockTeacher.id, updateTeacherDto, teacherUser);

      expect(result).toBeDefined();
      expect(service.update).toHaveBeenCalledWith(mockTeacher.id, updateTeacherDto);
    });
  });

  describe('remove', () => {
    it('should remove a teacher', async () => {
      mockTeachersService.remove.mockResolvedValue(undefined);

      await controller.remove(mockTeacher.id);

      expect(service.remove).toHaveBeenCalledWith(mockTeacher.id);
    });
  });
});


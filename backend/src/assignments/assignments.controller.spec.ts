import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from '../users/dto/create-assignment.dto';
import { UserRole } from '../users/entities/user.entity';
import { Assignment } from '../users/entities/assignment.entity';

describe('AssignmentsController', () => {
  let controller: AssignmentsController;
  let service: AssignmentsService;

  const mockAssignment: Assignment = {
    id: 'assignment-id',
    teacherId: 'teacher-id',
    studentId: 'student-id',
    teacher: null,
    student: null,
    createdAt: new Date(),
  };

  const mockAssignmentsService = {
    create: jest.fn(),
    findStudentsByTeacher: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentsController],
      providers: [
        {
          provide: AssignmentsService,
          useValue: mockAssignmentsService,
        },
      ],
    }).compile();

    controller = module.get<AssignmentsController>(AssignmentsController);
    service = module.get<AssignmentsService>(AssignmentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createAssignmentDto: CreateAssignmentDto = {
      teacherId: 'teacher-id',
      studentId: 'student-id',
    };

    it('should create an assignment when user is admin', async () => {
      const adminUser = {
        userId: 'admin-id',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      };

      mockAssignmentsService.create.mockResolvedValue(mockAssignment);

      const result = await controller.create(createAssignmentDto, adminUser);

      expect(result).toEqual(mockAssignment);
      expect(service.create).toHaveBeenCalledWith(createAssignmentDto);
    });

    it('should create an assignment when teacher creates for themselves', async () => {
      const teacherUser = {
        userId: 'teacher-id',
        email: 'teacher@example.com',
        role: UserRole.TEACHER,
      };

      mockAssignmentsService.create.mockResolvedValue(mockAssignment);

      const result = await controller.create(createAssignmentDto, teacherUser);

      expect(result).toEqual(mockAssignment);
      expect(service.create).toHaveBeenCalledWith(createAssignmentDto);
    });

    it('should throw ForbiddenException when teacher creates for different teacher', async () => {
      const teacherUser = {
        userId: 'different-teacher-id',
        email: 'teacher@example.com',
        role: UserRole.TEACHER,
      };

      await expect(
        controller.create(createAssignmentDto, teacherUser),
      ).rejects.toThrow(ForbiddenException);

      expect(service.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const assignmentId = 'assignment-id';

    it('should delete an assignment when user is admin', async () => {
      mockAssignmentsService.remove.mockResolvedValue(undefined);

      await controller.remove(assignmentId);

      expect(service.remove).toHaveBeenCalledWith(assignmentId);
    });

    it('should call remove service method with correct id', async () => {
      mockAssignmentsService.remove.mockResolvedValue(undefined);

      await controller.remove(assignmentId);

      expect(service.remove).toHaveBeenCalledTimes(1);
      expect(service.remove).toHaveBeenCalledWith(assignmentId);
    });
  });
});


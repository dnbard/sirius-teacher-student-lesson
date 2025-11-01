import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { Assignment } from '../users/entities/assignment.entity';
import { Teacher } from '../users/entities/teacher.entity';
import { Student } from '../users/entities/student.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateAssignmentDto } from '../users/dto/create-assignment.dto';

describe('AssignmentsService', () => {
  let service: AssignmentsService;
  let assignmentsRepository: Repository<Assignment>;
  let teachersRepository: Repository<Teacher>;
  let studentsRepository: Repository<Student>;

  const mockAssignmentsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockTeachersRepository = {
    findOne: jest.fn(),
  };

  const mockStudentsRepository = {
    findOne: jest.fn(),
  };

  const mockUsersRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        {
          provide: getRepositoryToken(Assignment),
          useValue: mockAssignmentsRepository,
        },
        {
          provide: getRepositoryToken(Teacher),
          useValue: mockTeachersRepository,
        },
        {
          provide: getRepositoryToken(Student),
          useValue: mockStudentsRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<AssignmentsService>(AssignmentsService);
    assignmentsRepository = module.get<Repository<Assignment>>(getRepositoryToken(Assignment));
    teachersRepository = module.get<Repository<Teacher>>(getRepositoryToken(Teacher));
    studentsRepository = module.get<Repository<Student>>(getRepositoryToken(Student));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createAssignmentDto: CreateAssignmentDto = {
      teacherId: 'teacher-id',
      studentId: 'student-id',
    };

    const mockTeacher = {
      id: 'teacher-id',
      instrument: 'Piano',
      experience: 5,
      user: {
        id: 'teacher-id',
        role: UserRole.TEACHER,
        email: 'teacher@example.com',
      },
    };

    const mockStudent = {
      id: 'student-id',
      instrument: 'Violin',
      user: {
        id: 'student-id',
        role: UserRole.STUDENT,
        email: 'student@example.com',
      },
    };

    it('should create an assignment successfully', async () => {
      mockTeachersRepository.findOne.mockResolvedValue(mockTeacher);
      mockStudentsRepository.findOne.mockResolvedValue(mockStudent);
      mockAssignmentsRepository.findOne.mockResolvedValue(null);

      const mockAssignment = {
        id: 'assignment-id',
        teacherId: 'teacher-id',
        studentId: 'student-id',
        createdAt: new Date(),
      };

      mockAssignmentsRepository.create.mockReturnValue(mockAssignment);
      mockAssignmentsRepository.save.mockResolvedValue(mockAssignment);

      const result = await service.create(createAssignmentDto);

      expect(result).toEqual(mockAssignment);
      expect(teachersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'teacher-id' },
        relations: ['user'],
      });
      expect(studentsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'student-id' },
        relations: ['user'],
      });
      expect(assignmentsRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when teacher does not exist', async () => {
      mockTeachersRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createAssignmentDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when student does not exist', async () => {
      mockTeachersRepository.findOne.mockResolvedValue(mockTeacher);
      mockStudentsRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createAssignmentDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when teacherId is not a teacher role', async () => {
      const invalidTeacher = {
        ...mockTeacher,
        user: { ...mockTeacher.user, role: UserRole.STUDENT },
      };

      mockTeachersRepository.findOne.mockResolvedValue(invalidTeacher);

      await expect(service.create(createAssignmentDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when studentId is not a student role', async () => {
      const invalidStudent = {
        ...mockStudent,
        user: { ...mockStudent.user, role: UserRole.TEACHER },
      };

      mockTeachersRepository.findOne.mockResolvedValue(mockTeacher);
      mockStudentsRepository.findOne.mockResolvedValue(invalidStudent);

      await expect(service.create(createAssignmentDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when assignment already exists', async () => {
      mockTeachersRepository.findOne.mockResolvedValue(mockTeacher);
      mockStudentsRepository.findOne.mockResolvedValue(mockStudent);
      mockAssignmentsRepository.findOne.mockResolvedValue({
        id: 'existing-assignment-id',
      });

      await expect(service.create(createAssignmentDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findStudentsByTeacher', () => {
    const teacherId = 'teacher-id';

    it('should return students for a teacher with assignmentId', async () => {
      const mockTeacher = {
        id: teacherId,
        instrument: 'Piano',
      };

      const mockStudents = [
        {
          id: 'student-1',
          instrument: 'Violin',
          user: {
            id: 'student-1',
            role: UserRole.STUDENT,
          },
        },
      ];

      const mockAssignments = [
        {
          id: 'assignment-1',
          teacherId,
          studentId: 'student-1',
          student: mockStudents[0],
        },
      ];

      mockTeachersRepository.findOne.mockResolvedValue(mockTeacher);
      mockAssignmentsRepository.find.mockResolvedValue(mockAssignments);

      const result = await service.findStudentsByTeacher(teacherId);

      // Check that assignmentId was added to the student
      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual('student-1');
      expect((result[0] as any).assignmentId).toEqual('assignment-1');
      expect(teachersRepository.findOne).toHaveBeenCalledWith({
        where: { id: teacherId },
      });
      expect(assignmentsRepository.find).toHaveBeenCalledWith({
        where: { teacherId },
        relations: ['student', 'student.user'],
      });
    });

    it('should throw NotFoundException when teacher does not exist', async () => {
      mockTeachersRepository.findOne.mockResolvedValue(null);

      await expect(service.findStudentsByTeacher(teacherId)).rejects.toThrow(NotFoundException);
    });

    it('should return empty array when teacher has no students', async () => {
      const mockTeacher = {
        id: teacherId,
        instrument: 'Piano',
      };

      mockTeachersRepository.findOne.mockResolvedValue(mockTeacher);
      mockAssignmentsRepository.find.mockResolvedValue([]);

      const result = await service.findStudentsByTeacher(teacherId);

      expect(result).toEqual([]);
    });
  });

  describe('remove', () => {
    const assignmentId = 'assignment-id';

    it('should delete an assignment successfully', async () => {
      const mockAssignment = {
        id: assignmentId,
        teacherId: 'teacher-id',
        studentId: 'student-id',
        createdAt: new Date(),
      };

      mockAssignmentsRepository.findOne.mockResolvedValue(mockAssignment);
      mockAssignmentsRepository.remove.mockResolvedValue(mockAssignment);

      await service.remove(assignmentId);

      expect(assignmentsRepository.findOne).toHaveBeenCalledWith({
        where: { id: assignmentId },
      });
      expect(assignmentsRepository.remove).toHaveBeenCalledWith(mockAssignment);
    });

    it('should throw NotFoundException when assignment does not exist', async () => {
      mockAssignmentsRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(assignmentId)).rejects.toThrow(NotFoundException);
      expect(assignmentsRepository.remove).not.toHaveBeenCalled();
    });
  });
});


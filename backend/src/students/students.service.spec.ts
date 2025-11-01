import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StudentsService } from './students.service';
import { Student } from '../users/entities/student.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateStudentDto } from '../users/dto/create-student.dto';
import { UpdateStudentDto } from '../users/dto/update-student.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

// Mock bcrypt module
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('StudentsService', () => {
  let service: StudentsService;
  let studentRepository: Repository<Student>;
  let userRepository: Repository<User>;

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

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        {
          provide: getRepositoryToken(Student),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
          },
        },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    studentRepository = module.get<Repository<Student>>(getRepositoryToken(Student));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
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

    it('should create a student successfully', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockStudent.user);
      jest.spyOn(studentRepository, 'create').mockReturnValue(mockStudent);
      mockQueryRunner.manager.save
        .mockResolvedValueOnce(mockStudent.user)
        .mockResolvedValueOnce(mockStudent);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockStudent);

      const result = await service.create(createStudentDto);

      expect(result).toEqual(mockStudent);
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockStudent.user);

      await expect(service.create(createStudentDto)).rejects.toThrow(ConflictException);
    });

    it('should rollback transaction on error', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockStudent.user);
      mockQueryRunner.manager.save.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createStudentDto)).rejects.toThrow('Database error');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all students', async () => {
      const mockStudents = [mockStudent];
      jest.spyOn(studentRepository, 'find').mockResolvedValue(mockStudents);

      const result = await service.findAll();

      expect(result).toEqual(mockStudents);
      expect(studentRepository.find).toHaveBeenCalledWith({
        relations: ['user'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a student if found', async () => {
      jest.spyOn(studentRepository, 'findOne').mockResolvedValue(mockStudent);

      const result = await service.findOne(mockStudent.id);

      expect(result).toEqual(mockStudent);
      expect(studentRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockStudent.id },
        relations: ['user'],
      });
    });

    it('should throw NotFoundException if student not found', async () => {
      jest.spyOn(studentRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateStudentDto: UpdateStudentDto = {
      firstName: 'Jane',
      instrument: 'Guitar',
    };

    it('should update a student successfully', async () => {
      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockStudent)
        .mockResolvedValueOnce({ ...mockStudent, ...updateStudentDto });
      mockQueryRunner.manager.save.mockResolvedValue(mockStudent);

      const result = await service.update(mockStudent.id, updateStudentDto);

      expect(result).toBeDefined();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException if student not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(service.update('non-existent-id', updateStudentDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      const updateDto: UpdateStudentDto = {
        email: 'existing@example.com',
      };

      const existingUser: User = {
        id: 'different-id',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: 'hashedPassword',
        role: UserRole.STUDENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockStudent);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(existingUser);

      await expect(service.update(mockStudent.id, updateDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove a student successfully', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockStudent);
      jest.spyOn(userRepository, 'remove').mockResolvedValue(mockStudent.user);

      await service.remove(mockStudent.id);

      expect(service.findOne).toHaveBeenCalledWith(mockStudent.id);
      expect(userRepository.remove).toHaveBeenCalledWith(mockStudent.user);
    });

    it('should throw NotFoundException if student not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});


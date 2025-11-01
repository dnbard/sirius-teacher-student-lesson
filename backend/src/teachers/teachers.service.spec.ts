import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { TeachersService } from './teachers.service';
import { Teacher } from '../users/entities/teacher.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateTeacherDto } from '../users/dto/create-teacher.dto';
import { UpdateTeacherDto } from '../users/dto/update-teacher.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

// Mock bcrypt module
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('TeachersService', () => {
  let service: TeachersService;
  let teacherRepository: Repository<Teacher>;
  let userRepository: Repository<User>;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

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
        TeachersService,
        {
          provide: getRepositoryToken(Teacher),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
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

    service = module.get<TeachersService>(TeachersService);
    teacherRepository = module.get<Repository<Teacher>>(getRepositoryToken(Teacher));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    dataSource = module.get<DataSource>(DataSource);
    queryRunner = dataSource.createQueryRunner();
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

    it('should create a teacher successfully', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockTeacher.user);
      jest.spyOn(teacherRepository, 'create').mockReturnValue(mockTeacher);
      mockQueryRunner.manager.save
        .mockResolvedValueOnce(mockTeacher.user)
        .mockResolvedValueOnce(mockTeacher);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTeacher);

      const result = await service.create(createTeacherDto);

      expect(result).toEqual(mockTeacher);
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockTeacher.user);

      await expect(service.create(createTeacherDto)).rejects.toThrow(ConflictException);
    });

    it('should rollback transaction on error', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockTeacher.user);
      mockQueryRunner.manager.save.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createTeacherDto)).rejects.toThrow('Database error');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a teacher if found', async () => {
      jest.spyOn(teacherRepository, 'findOne').mockResolvedValue(mockTeacher);

      const result = await service.findOne(mockTeacher.id);

      expect(result).toEqual(mockTeacher);
      expect(teacherRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockTeacher.id },
        relations: ['user'],
      });
    });

    it('should throw NotFoundException if teacher not found', async () => {
      jest.spyOn(teacherRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateTeacherDto: UpdateTeacherDto = {
      firstName: 'Jane',
      instrument: 'Guitar',
      experience: 10,
    };

    it('should update a teacher successfully', async () => {
      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockTeacher)
        .mockResolvedValueOnce({ ...mockTeacher, ...updateTeacherDto });
      mockQueryRunner.manager.save.mockResolvedValue(mockTeacher);

      const result = await service.update(mockTeacher.id, updateTeacherDto);

      expect(result).toBeDefined();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException if teacher not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(service.update('non-existent-id', updateTeacherDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      const updateDto: UpdateTeacherDto = {
        email: 'existing@example.com',
      };

      const existingUser: User = {
        id: 'different-id',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'existing@example.com',
        password: 'hashedPassword',
        role: UserRole.TEACHER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockTeacher);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(existingUser);

      await expect(service.update(mockTeacher.id, updateDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove a teacher successfully', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTeacher);
      jest.spyOn(userRepository, 'remove').mockResolvedValue(mockTeacher.user);

      await service.remove(mockTeacher.id);

      expect(service.findOne).toHaveBeenCalledWith(mockTeacher.id);
      expect(userRepository.remove).toHaveBeenCalledWith(mockTeacher.user);
    });

    it('should throw NotFoundException if teacher not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});


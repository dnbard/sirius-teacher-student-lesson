import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Mock bcrypt
jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  // Mock user data
  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'hashedPassword123',
    role: UserRole.STUDENT,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockTeacher: User = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    password: 'hashedPassword456',
    role: UserRole.TEACHER,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  // Mock repository
  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      role: UserRole.STUDENT,
    };

    it('should successfully create a user with hashed password', async () => {
      // Arrange
      const hashedPassword = 'hashedPassword123';
      mockRepository.findOne.mockResolvedValue(null); // No existing user
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockRepository.create.mockReturnValue({ ...mockUser, password: hashedPassword });
      mockRepository.save.mockResolvedValue({ ...mockUser, password: hashedPassword });

      // Act
      const result = await service.create(createUserDto);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: hashedPassword,
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual({ ...mockUser, password: hashedPassword });
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockUser); // Existing user

      // Act & Assert
      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('User with this email already exists'),
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should properly hash password before saving', async () => {
      // Arrange
      const hashedPassword = 'hashedPassword123';
      mockRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockRepository.create.mockReturnValue({ ...mockUser, password: hashedPassword });
      mockRepository.save.mockResolvedValue({ ...mockUser, password: hashedPassword });

      // Act
      await service.create(createUserDto);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password: hashedPassword,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      // Arrange
      const users = [mockUser, mockTeacher];
      mockRepository.find.mockResolvedValue(users);

      // Act
      const result = await service.findAll();

      // Assert
      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(users);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no users exist', async () => {
      // Arrange
      mockRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return user by ID', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findOne(mockUser.id);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      const userId = 'non-existent-id';
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(userId)).rejects.toThrow(
        new NotFoundException(`User with ID ${userId} not found`),
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findByEmail(mockUser.email);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user does not exist', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findByEmail(email);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toBeNull();
    });
  });

  describe('findByRole', () => {
    it('should return users filtered by STUDENT role', async () => {
      // Arrange
      const students = [mockUser];
      mockRepository.find.mockResolvedValue(students);

      // Act
      const result = await service.findByRole(UserRole.STUDENT);

      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { role: UserRole.STUDENT },
      });
      expect(result).toEqual(students);
      expect(result).toHaveLength(1);
    });

    it('should return users filtered by TEACHER role', async () => {
      // Arrange
      const teachers = [mockTeacher];
      mockRepository.find.mockResolvedValue(teachers);

      // Act
      const result = await service.findByRole(UserRole.TEACHER);

      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { role: UserRole.TEACHER },
      });
      expect(result).toEqual(teachers);
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no users with that role exist', async () => {
      // Arrange
      mockRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.findByRole(UserRole.TEACHER);

      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { role: UserRole.TEACHER },
      });
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'John Updated',
    };

    it('should successfully update user', async () => {
      // Arrange
      const updatedUser = { ...mockUser, firstName: 'John Updated' };
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      // Act
      const result = await service.update(mockUser.id, updateUserDto);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John Updated',
        }),
      );
      expect(result).toEqual(updatedUser);
    });

    it('should hash password when password is updated', async () => {
      // Arrange
      const updateDtoWithPassword: UpdateUserDto = {
        password: 'newPassword123',
      };
      const hashedPassword = 'newHashedPassword';
      mockRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      // Act
      await service.update(mockUser.id, updateDtoWithPassword);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          password: hashedPassword,
        }),
      );
    });

    it('should throw ConflictException when updating to existing email', async () => {
      // Arrange
      const updateDtoWithEmail: UpdateUserDto = {
        email: 'existing@example.com',
      };
      const existingUser = { ...mockTeacher, email: 'existing@example.com' };
      
      // First call returns the user being updated
      // Second call returns another user with the same email
      mockRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(existingUser);

      // Act & Assert
      await expect(
        service.update(mockUser.id, updateDtoWithEmail),
      ).rejects.toThrow(
        new ConflictException('User with this email already exists'),
      );
    });

    it('should allow updating user without changing email', async () => {
      // Arrange
      const updateDtoSameEmail: UpdateUserDto = {
        email: mockUser.email, // Same email
        firstName: 'John Updated',
      };
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        firstName: 'John Updated',
      });

      // Act
      const result = await service.update(mockUser.id, updateDtoSameEmail);

      // Assert
      expect(result.firstName).toBe('John Updated');
      expect(result.email).toBe(mockUser.email);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      const userId = 'non-existent-id';
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(userId, updateUserDto)).rejects.toThrow(
        new NotFoundException(`User with ID ${userId} not found`),
      );
    });

    it('should not hash password if not provided in update', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        firstName: 'John Updated',
      });

      // Act
      await service.update(mockUser.id, { firstName: 'John Updated' });

      // Assert
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should successfully remove user', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.remove.mockResolvedValue(mockUser);

      // Act
      await service.remove(mockUser.id);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      const userId = 'non-existent-id';
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(userId)).rejects.toThrow(
        new NotFoundException(`User with ID ${userId} not found`),
      );
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('validatePassword', () => {
    it('should return true for correct password', async () => {
      // Arrange
      const plainPassword = 'password123';
      const hashedPassword = 'hashedPassword123';
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.validatePassword(plainPassword, hashedPassword);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      // Arrange
      const plainPassword = 'wrongPassword';
      const hashedPassword = 'hashedPassword123';
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await service.validatePassword(plainPassword, hashedPassword);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(result).toBe(false);
    });
  });
});


import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRole } from '../users/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
  };

  const mockResponse = () => {
    const res: Partial<Response> = {
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
    return res as Response;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should login successfully and set cookie', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const loginResult = {
        accessToken: 'mock-jwt-token',
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.STUDENT,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockAuthService.login.mockResolvedValue(loginResult);

      const response = mockResponse();
      const result = await controller.login(loginDto, response);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(response.cookie).toHaveBeenCalledWith(
        'access_token',
        'mock-jwt-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000,
        }),
      );
      expect(result).toEqual(loginResult);
    });

    it('should set secure cookie in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const loginResult = {
        accessToken: 'mock-jwt-token',
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.STUDENT,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockAuthService.login.mockResolvedValue(loginResult);

      const response = mockResponse();
      await controller.login(loginDto, response);

      expect(response.cookie).toHaveBeenCalledWith(
        'access_token',
        'mock-jwt-token',
        expect.objectContaining({
          secure: true,
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('logout', () => {
    it('should clear cookie and return success message', () => {
      const response = mockResponse();
      const result = controller.logout(response);

      expect(response.clearCookie).toHaveBeenCalledWith('access_token');
      expect(result).toEqual({
        message: 'Logged out successfully',
      });
    });
  });
});


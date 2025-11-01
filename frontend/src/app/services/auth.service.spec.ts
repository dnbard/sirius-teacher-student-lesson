import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LoginRequest, LoginResponse, UserRole } from '../models/user.model';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  const mockLoginResponse: LoginResponse = {
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

  beforeEach(() => {
    localStorage.clear();

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login successfully and store user data', (done) => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      service.login(loginRequest).subscribe({
        next: (response) => {
          expect(response).toEqual(mockLoginResponse);
          expect(localStorage.getItem('currentUser')).toBe(
            JSON.stringify(mockLoginResponse.user)
          );
          expect(localStorage.getItem('accessToken')).toBe(mockLoginResponse.accessToken);
          expect(service.currentUserValue).toEqual(mockLoginResponse.user);
          expect(service.tokenValue).toBe(mockLoginResponse.accessToken);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginRequest);
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockLoginResponse);
    });

    it('should update currentUser$ observable on login', (done) => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      service.currentUser$.subscribe((user) => {
        if (user) {
          expect(user).toEqual(mockLoginResponse.user);
          done();
        }
      });

      service.login(loginRequest).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth`);
      req.flush(mockLoginResponse);
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      // Setup logged in state
      localStorage.setItem('currentUser', JSON.stringify(mockLoginResponse.user));
      localStorage.setItem('accessToken', mockLoginResponse.accessToken);
    });

    it('should logout successfully and clear data', (done) => {
      service.logout().subscribe({
        next: () => {
          expect(localStorage.getItem('currentUser')).toBeNull();
          expect(localStorage.getItem('accessToken')).toBeNull();
          expect(service.currentUserValue).toBeNull();
          expect(service.tokenValue).toBeNull();
          expect(router.navigate).toHaveBeenCalledWith(['/login']);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ message: 'Logged out successfully' });
    });

    it('should update currentUser$ observable on logout', (done) => {
      let emissionCount = 0;

      service.currentUser$.subscribe((user) => {
        emissionCount++;
        if (emissionCount === 2) {
          // Second emission after logout
          expect(user).toBeNull();
          done();
        }
      });

      service.logout().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.flush({ message: 'Logged out successfully' });
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user is logged in', () => {
      localStorage.setItem('currentUser', JSON.stringify(mockLoginResponse.user));
      
      // Create new service instance to pick up localStorage
      const newService = new AuthService(
        TestBed.inject(HttpClientTestingModule) as any,
        router
      );
      
      expect(newService.isAuthenticated()).toBe(true);
    });

    it('should return false when user is not logged in', () => {
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', (done) => {
      service.getProfile().subscribe({
        next: (user) => {
          expect(user).toEqual(mockLoginResponse.user);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockLoginResponse.user);
    });
  });

  describe('initialization from localStorage', () => {
    it('should restore user and token from localStorage on initialization', () => {
      // Set localStorage before creating the TestBed
      localStorage.setItem('currentUser', JSON.stringify(mockLoginResponse.user));
      localStorage.setItem('accessToken', mockLoginResponse.accessToken);

      // Create a fresh TestBed with new service instance
      const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
      
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          AuthService,
          { provide: Router, useValue: routerSpy },
        ],
      });

      const newService = TestBed.inject(AuthService);

      // Check that user data is restored (dates will be strings after JSON parse)
      expect(newService.currentUserValue).toBeTruthy();
      expect(newService.currentUserValue?.id).toBe(mockLoginResponse.user.id);
      expect(newService.currentUserValue?.email).toBe(mockLoginResponse.user.email);
      expect(newService.currentUserValue?.firstName).toBe(mockLoginResponse.user.firstName);
      expect(newService.currentUserValue?.lastName).toBe(mockLoginResponse.user.lastName);
      expect(newService.currentUserValue?.role).toBe(mockLoginResponse.user.role);
      expect(newService.tokenValue).toBe(mockLoginResponse.accessToken);
      
      // Clean up
      localStorage.clear();
    });

    it('should handle missing localStorage data', () => {
      expect(service.currentUserValue).toBeNull();
      expect(service.tokenValue).toBeNull();
    });
  });
});


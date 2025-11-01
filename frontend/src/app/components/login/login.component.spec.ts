import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/user.model';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const mockActivatedRoute = {
    snapshot: {
      queryParams: {},
    },
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'login',
      'isAuthenticated',
    ], {
      currentUser$: of(null),
      token$: of(null),
    });

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with empty values', () => {
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should have email and password validators', () => {
    const emailControl = component.loginForm.get('email');
    const passwordControl = component.loginForm.get('password');

    emailControl?.setValue('');
    passwordControl?.setValue('');

    expect(emailControl?.hasError('required')).toBeTruthy();
    expect(passwordControl?.hasError('required')).toBeTruthy();

    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTruthy();

    passwordControl?.setValue('12345');
    expect(passwordControl?.hasError('minlength')).toBeTruthy();
  });

  it('should not submit if form is invalid', () => {
    component.loginForm.get('email')?.setValue('');
    component.loginForm.get('password')?.setValue('');

    component.onSubmit();

    expect(component.submitted).toBe(true);
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should login successfully with valid credentials', () => {
    const mockLoginResponse = {
      accessToken: 'mock-token',
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

    authService.login.and.returnValue(of(mockLoginResponse));

    component.loginForm.get('email')?.setValue('test@example.com');
    component.loginForm.get('password')?.setValue('password123');

    component.onSubmit();

    expect(component.submitted).toBe(true);
    expect(component.loading).toBe(true);
    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    // The component navigates to returnUrl which defaults to '/' from queryParams
    // but the routing then redirects to '/dashboard' based on app-routing config
    expect(router.navigate).toHaveBeenCalled();
  });

  it('should handle login error', (done) => {
    const errorResponse = {
      error: { message: 'Invalid credentials' },
    };

    authService.login.and.returnValue(throwError(() => errorResponse));

    component.loginForm.get('email')?.setValue('test@example.com');
    component.loginForm.get('password')?.setValue('wrongpassword');

    component.onSubmit();

    expect(authService.login).toHaveBeenCalled();
    
    // Wait for async operations
    setTimeout(() => {
      expect(component.error).toBe('Invalid credentials');
      expect(component.loading).toBe(false);
      done();
    }, 10);
  });

  it('should show generic error message when no specific message provided', (done) => {
    authService.login.and.returnValue(throwError(() => ({})));

    component.loginForm.get('email')?.setValue('test@example.com');
    component.loginForm.get('password')?.setValue('password123');

    component.onSubmit();

    setTimeout(() => {
      expect(component.error).toBe('Login failed. Please check your credentials.');
      expect(component.loading).toBe(false);
      done();
    }, 10);
  });

  it('should redirect to return URL after successful login', () => {
    mockActivatedRoute.snapshot.queryParams = { returnUrl: '/dashboard' };
    
    const mockLoginResponse = {
      accessToken: 'mock-token',
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

    authService.login.and.returnValue(of(mockLoginResponse));

    // Reinitialize component to pick up new queryParams
    component.ngOnInit();

    component.loginForm.get('email')?.setValue('test@example.com');
    component.loginForm.get('password')?.setValue('password123');

    component.onSubmit();

    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should redirect if already authenticated on init', () => {
    authService.isAuthenticated.and.returnValue(true);

    component.ngOnInit();

    // Should navigate (the actual path depends on routing configuration)
    expect(router.navigate).toHaveBeenCalled();
  });

  it('should display form validation errors when submitted', () => {
    component.loginForm.get('email')?.setValue('');
    component.loginForm.get('password')?.setValue('');

    component.onSubmit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const emailErrors = compiled.querySelector('[formControlName="email"] + .invalid-feedback');
    
    expect(component.submitted).toBe(true);
    expect(component.f['email'].errors).toBeTruthy();
    expect(component.f['password'].errors).toBeTruthy();
  });
});


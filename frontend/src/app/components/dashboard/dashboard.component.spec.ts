import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../services/auth.service';
import { User, UserRole } from '../../models/user.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let currentUserSubject: BehaviorSubject<User | null>;

  const createMockUser = (role: UserRole): User => ({
    id: '123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: role,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    currentUserSubject = new BehaviorSubject<User | null>(null);

    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser$: currentUserSubject.asObservable(),
    });

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    // Don't call detectChanges yet - let each test control when to do that
  });

  describe('Notice card visibility', () => {
    it('should show notice card for student users', () => {
      const mockStudent = createMockUser(UserRole.STUDENT);
      currentUserSubject.next(mockStudent);
      
      component.ngOnInit();
      fixture.detectChanges();

      const noticeCard = fixture.nativeElement.querySelector('.notice-card');
      expect(noticeCard).toBeTruthy();
    });

    it('should show notice card for teacher users', () => {
      const mockTeacher = createMockUser(UserRole.TEACHER);
      currentUserSubject.next(mockTeacher);
      
      component.ngOnInit();
      fixture.detectChanges();

      const noticeCard = fixture.nativeElement.querySelector('.notice-card');
      expect(noticeCard).toBeTruthy();
    });

    it('should NOT show notice card for admin users', () => {
      const mockAdmin = createMockUser(UserRole.ADMIN);
      currentUserSubject.next(mockAdmin);
      
      component.ngOnInit();
      fixture.detectChanges();

      const noticeCard = fixture.nativeElement.querySelector('.notice-card');
      expect(noticeCard).toBeNull();
    });
  });

  describe('User information display', () => {
    it('should display user first name in welcome message', () => {
      const mockUser = createMockUser(UserRole.STUDENT);
      currentUserSubject.next(mockUser);
      
      component.ngOnInit();
      fixture.detectChanges();

      const welcomeSection = fixture.nativeElement.querySelector('.welcome-section h2');
      expect(welcomeSection?.textContent).toContain('Test');
    });

    it('should display user role', () => {
      const mockUser = createMockUser(UserRole.TEACHER);
      currentUserSubject.next(mockUser);
      
      component.ngOnInit();
      fixture.detectChanges();

      const roleElement = fixture.nativeElement.querySelector('.user-role');
      expect(roleElement?.textContent).toContain('teacher');
    });

    it('should display user email in details', () => {
      const mockUser = createMockUser(UserRole.ADMIN);
      currentUserSubject.next(mockUser);
      
      component.ngOnInit();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('test@example.com');
    });
  });
});


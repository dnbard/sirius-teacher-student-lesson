import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../services/auth.service';
import { TeachersService } from '../../services/teachers.service';
import { StudentsService } from '../../services/students.service';
import { User, UserRole } from '../../models/user.model';
import { Teacher } from '../../models/teacher.model';
import { Student } from '../../models/student.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let teachersService: jasmine.SpyObj<TeachersService>;
  let studentsService: jasmine.SpyObj<StudentsService>;
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

  const createMockTeacher = (id: string, firstName: string, lastName: string): Teacher => ({
    id,
    user: {
      id,
      email: `${firstName.toLowerCase()}@example.com`,
      firstName,
      lastName,
      role: UserRole.TEACHER,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    instrument: 'Piano',
    experience: 5,
  });

  const createMockStudent = (id: string, firstName: string, lastName: string): Student => ({
    id,
    user: {
      id,
      email: `${firstName.toLowerCase()}@example.com`,
      firstName,
      lastName,
      role: UserRole.STUDENT,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    instrument: 'Guitar',
  });

  beforeEach(async () => {
    currentUserSubject = new BehaviorSubject<User | null>(null);

    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser$: currentUserSubject.asObservable(),
    });

    const teachersServiceSpy = jasmine.createSpyObj('TeachersService', ['getAll', 'delete']);
    const studentsServiceSpy = jasmine.createSpyObj('StudentsService', ['getAll', 'delete']);

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TeachersService, useValue: teachersServiceSpy },
        { provide: StudentsService, useValue: studentsServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    teachersService = TestBed.inject(TeachersService) as jasmine.SpyObj<TeachersService>;
    studentsService = TestBed.inject(StudentsService) as jasmine.SpyObj<StudentsService>;
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
      teachersService.getAll.and.returnValue(of([]));
      studentsService.getAll.and.returnValue(of([]));
      
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
      teachersService.getAll.and.returnValue(of([]));
      studentsService.getAll.and.returnValue(of([]));
      
      currentUserSubject.next(mockUser);
      
      component.ngOnInit();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('test@example.com');
    });
  });

  describe('Admin users table', () => {
    it('should load teachers and students for admin users', () => {
      const mockAdmin = createMockUser(UserRole.ADMIN);
      const mockTeachers = [createMockTeacher('1', 'John', 'Doe')];
      const mockStudents = [createMockStudent('2', 'Jane', 'Smith')];

      teachersService.getAll.and.returnValue(of(mockTeachers));
      studentsService.getAll.and.returnValue(of(mockStudents));

      currentUserSubject.next(mockAdmin);
      component.ngOnInit();
      fixture.detectChanges();

      expect(teachersService.getAll).toHaveBeenCalled();
      expect(studentsService.getAll).toHaveBeenCalled();
      expect(component.usersTableData.length).toBe(2);
    });

    it('should display users table for admin users', () => {
      const mockAdmin = createMockUser(UserRole.ADMIN);
      const mockTeachers = [createMockTeacher('1', 'John', 'Doe')];
      const mockStudents = [createMockStudent('2', 'Jane', 'Smith')];

      teachersService.getAll.and.returnValue(of(mockTeachers));
      studentsService.getAll.and.returnValue(of(mockStudents));

      currentUserSubject.next(mockAdmin);
      component.ngOnInit();
      fixture.detectChanges();

      const tableCard = fixture.nativeElement.querySelector('.users-table-card');
      expect(tableCard).toBeTruthy();
    });

    it('should NOT display users table for non-admin users', () => {
      const mockStudent = createMockUser(UserRole.STUDENT);
      currentUserSubject.next(mockStudent);

      component.ngOnInit();
      fixture.detectChanges();

      const tableCard = fixture.nativeElement.querySelector('.users-table-card');
      expect(tableCard).toBeNull();
    });

    it('should display teacher with experience badge', () => {
      const mockAdmin = createMockUser(UserRole.ADMIN);
      const mockTeachers = [createMockTeacher('1', 'John', 'Doe')];

      teachersService.getAll.and.returnValue(of(mockTeachers));
      studentsService.getAll.and.returnValue(of([]));

      currentUserSubject.next(mockAdmin);
      component.ngOnInit();
      fixture.detectChanges();

      const experienceBadge = fixture.nativeElement.querySelector('.experience-badge');
      expect(experienceBadge).toBeTruthy();
      expect(experienceBadge?.textContent).toContain('5 years');
    });

    it('should NOT display experience badge for students', () => {
      const mockAdmin = createMockUser(UserRole.ADMIN);
      const mockStudents = [createMockStudent('2', 'Jane', 'Smith')];

      teachersService.getAll.and.returnValue(of([]));
      studentsService.getAll.and.returnValue(of(mockStudents));

      currentUserSubject.next(mockAdmin);
      component.ngOnInit();
      fixture.detectChanges();

      const experienceBadge = fixture.nativeElement.querySelector('.experience-badge');
      expect(experienceBadge).toBeNull();
    });
  });

  describe('Delete functionality', () => {
    it('should delete teacher after confirmation and remove from table', () => {
      const mockAdmin = createMockUser(UserRole.ADMIN);
      const mockTeachers = [createMockTeacher('1', 'John', 'Doe')];
      const mockStudents = [createMockStudent('2', 'Jane', 'Smith')];

      teachersService.getAll.and.returnValue(of(mockTeachers));
      studentsService.getAll.and.returnValue(of(mockStudents));
      teachersService.delete.and.returnValue(of(void 0));

      currentUserSubject.next(mockAdmin);
      component.ngOnInit();
      fixture.detectChanges();

      // Verify initial state
      expect(component.usersTableData.length).toBe(2);

      // Mock confirm dialog to return true
      spyOn(window, 'confirm').and.returnValue(true);

      // Delete the teacher
      const teacherToDelete = component.usersTableData[0];
      component.deleteUser(teacherToDelete);

      // Verify confirmation was shown
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete teacher "John Doe"? This action cannot be undone.'
      );

      // Verify delete was called with correct ID
      expect(teachersService.delete).toHaveBeenCalledWith('1');

      // Verify user was removed from table
      expect(component.usersTableData.length).toBe(1);
      expect(component.usersTableData[0].name).toBe('Jane Smith');
    });
  });
});


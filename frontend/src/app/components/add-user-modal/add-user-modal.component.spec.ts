import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { AddUserModalComponent } from './add-user-modal.component';
import { TeachersService } from '../../services/teachers.service';
import { StudentsService } from '../../services/students.service';
import { UserRole } from '../../models/user.model';

describe('AddUserModalComponent', () => {
  let component: AddUserModalComponent;
  let fixture: ComponentFixture<AddUserModalComponent>;
  let teachersService: jasmine.SpyObj<TeachersService>;
  let studentsService: jasmine.SpyObj<StudentsService>;

  beforeEach(async () => {
    const teachersServiceSpy = jasmine.createSpyObj('TeachersService', ['create']);
    const studentsServiceSpy = jasmine.createSpyObj('StudentsService', ['create']);

    await TestBed.configureTestingModule({
      declarations: [ AddUserModalComponent ],
      imports: [ ReactiveFormsModule, HttpClientTestingModule ],
      providers: [
        { provide: TeachersService, useValue: teachersServiceSpy },
        { provide: StudentsService, useValue: studentsServiceSpy }
      ]
    })
    .compileComponents();

    teachersService = TestBed.inject(TeachersService) as jasmine.SpyObj<TeachersService>;
    studentsService = TestBed.inject(StudentsService) as jasmine.SpyObj<StudentsService>;

    fixture = TestBed.createComponent(AddUserModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.userForm.get('firstName')?.value).toBe('');
    expect(component.userForm.get('lastName')?.value).toBe('');
    expect(component.userForm.get('email')?.value).toBe('');
    expect(component.userForm.get('password')?.value).toBe('');
    expect(component.userForm.get('role')?.value).toBe('teacher');
    expect(component.userForm.get('instrument')?.value).toBe('');
    expect(component.userForm.get('experience')?.value).toBe(0);
  });

  it('should emit closeModal when onClose is called', () => {
    spyOn(component.closeModal, 'emit');
    component.onClose();
    expect(component.closeModal.emit).toHaveBeenCalled();
  });

  it('should validate required fields', () => {
    const form = component.userForm;
    
    expect(form.valid).toBeFalsy();
    
    form.patchValue({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      role: 'teacher',
      instrument: 'Piano',
      experience: 5
    });
    
    expect(form.valid).toBeTruthy();
  });

  it('should validate email format', () => {
    const emailControl = component.userForm.get('email');
    
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTruthy();
    
    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('email')).toBeFalsy();
  });

  it('should validate password minimum length', () => {
    const passwordControl = component.userForm.get('password');
    
    passwordControl?.setValue('short');
    expect(passwordControl?.hasError('minlength')).toBeTruthy();
    
    passwordControl?.setValue('longenough');
    expect(passwordControl?.hasError('minlength')).toBeFalsy();
  });

  it('should require experience for teachers', () => {
    component.userForm.patchValue({ role: 'teacher' });
    const experienceControl = component.userForm.get('experience');
    
    // Clear the value to test required validator
    experienceControl?.setValue(null);
    expect(experienceControl?.hasError('required')).toBeTruthy();
    
    experienceControl?.setValue(5);
    expect(experienceControl?.hasError('required')).toBeFalsy();
  });

  it('should not require experience for students', () => {
    component.userForm.patchValue({ role: 'student' });
    const experienceControl = component.userForm.get('experience');
    
    expect(experienceControl?.hasError('required')).toBeFalsy();
  });

  it('should return true for isTeacher when role is teacher', () => {
    component.userForm.patchValue({ role: 'teacher' });
    expect(component.isTeacher).toBeTruthy();
  });

  it('should return false for isTeacher when role is student', () => {
    component.userForm.patchValue({ role: 'student' });
    expect(component.isTeacher).toBeFalsy();
  });

  it('should not submit form if invalid', () => {
    spyOn(component.userForm, 'markAsTouched');
    component.onSubmit();
    
    expect(teachersService.create).not.toHaveBeenCalled();
    expect(studentsService.create).not.toHaveBeenCalled();
  });

  it('should create teacher when form is valid and role is teacher', () => {
    const mockTeacher = {
      id: '1',
      instrument: 'Piano',
      experience: 5,
      user: {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        role: UserRole.TEACHER,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    teachersService.create.and.returnValue(of(mockTeacher));
    spyOn(component.userCreated, 'emit');
    spyOn(component.closeModal, 'emit');

    component.userForm.patchValue({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      role: 'teacher',
      instrument: 'Piano',
      experience: 5
    });

    component.onSubmit();

    expect(teachersService.create).toHaveBeenCalledWith({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      instrument: 'Piano',
      experience: 5
    });
    expect(component.userCreated.emit).toHaveBeenCalled();
    expect(component.closeModal.emit).toHaveBeenCalled();
  });

  it('should create student when form is valid and role is student', () => {
    const mockStudent = {
      id: '1',
      instrument: 'Guitar',
      user: {
        id: '1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        role: UserRole.STUDENT,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    studentsService.create.and.returnValue(of(mockStudent));
    spyOn(component.userCreated, 'emit');
    spyOn(component.closeModal, 'emit');

    component.userForm.patchValue({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      password: 'password123',
      role: 'student',
      instrument: 'Guitar'
    });

    component.onSubmit();

    expect(studentsService.create).toHaveBeenCalledWith({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      password: 'password123',
      instrument: 'Guitar'
    });
    expect(component.userCreated.emit).toHaveBeenCalled();
    expect(component.closeModal.emit).toHaveBeenCalled();
  });

  it('should handle teacher creation error', () => {
    teachersService.create.and.returnValue(throwError(() => ({ 
      error: { message: 'Email already exists' } 
    })));

    component.userForm.patchValue({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      role: 'teacher',
      instrument: 'Piano',
      experience: 5
    });

    component.onSubmit();

    expect(component.errorMessage).toBe('Email already exists');
    expect(component.isSubmitting).toBeFalsy();
  });

  it('should handle student creation error', () => {
    studentsService.create.and.returnValue(throwError(() => ({ 
      error: { message: 'Email already exists' } 
    })));

    component.userForm.patchValue({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      password: 'password123',
      role: 'student',
      instrument: 'Guitar'
    });

    component.onSubmit();

    expect(component.errorMessage).toBe('Email already exists');
    expect(component.isSubmitting).toBeFalsy();
  });

  it('should show default error message when error has no message', () => {
    teachersService.create.and.returnValue(throwError(() => ({ error: {} })));

    component.userForm.patchValue({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      role: 'teacher',
      instrument: 'Piano',
      experience: 5
    });

    component.onSubmit();

    expect(component.errorMessage).toBe('Failed to create teacher. Please try again.');
    expect(component.isSubmitting).toBeFalsy();
  });
});


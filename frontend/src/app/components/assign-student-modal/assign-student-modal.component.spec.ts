import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { AssignStudentModalComponent } from './assign-student-modal.component';
import { AssignmentsService } from '../../services/assignments.service';
import { StudentsService } from '../../services/students.service';
import { Student } from '../../models/student.model';

describe('AssignStudentModalComponent', () => {
  let component: AssignStudentModalComponent;
  let fixture: ComponentFixture<AssignStudentModalComponent>;
  let assignmentsService: jasmine.SpyObj<AssignmentsService>;
  let studentsService: jasmine.SpyObj<StudentsService>;

  const mockStudents: Student[] = [
    {
      id: '1',
      user: {
        id: 'user1',
        email: 'student1@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'student' as any,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      instrument: 'Piano'
    },
    {
      id: '2',
      user: {
        id: 'user2',
        email: 'student2@test.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'student' as any,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      instrument: 'Guitar'
    }
  ];

  beforeEach(async () => {
    const assignmentsServiceSpy = jasmine.createSpyObj('AssignmentsService', ['create']);
    const studentsServiceSpy = jasmine.createSpyObj('StudentsService', ['getAll']);

    await TestBed.configureTestingModule({
      declarations: [ AssignStudentModalComponent ],
      imports: [ FormsModule, HttpClientTestingModule ],
      providers: [
        { provide: AssignmentsService, useValue: assignmentsServiceSpy },
        { provide: StudentsService, useValue: studentsServiceSpy }
      ]
    })
    .compileComponents();

    assignmentsService = TestBed.inject(AssignmentsService) as jasmine.SpyObj<AssignmentsService>;
    studentsService = TestBed.inject(StudentsService) as jasmine.SpyObj<StudentsService>;

    fixture = TestBed.createComponent(AssignStudentModalComponent);
    component = fixture.componentInstance;
    component.teacherId = 'teacher1';
    component.teacherName = 'Professor Smith';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load students on init', () => {
    studentsService.getAll.and.returnValue(of(mockStudents));
    
    component.ngOnInit();
    
    expect(studentsService.getAll).toHaveBeenCalled();
    expect(component.students).toEqual(mockStudents);
    expect(component.isLoading).toBe(false);
  });

  it('should handle error when loading students', () => {
    const error = { message: 'Failed to load' };
    studentsService.getAll.and.returnValue(throwError(() => error));
    
    component.ngOnInit();
    
    expect(component.errorMessage).toBe('Failed to load students. Please try again.');
    expect(component.isLoading).toBe(false);
  });

  it('should emit closeModal when onClose is called', () => {
    spyOn(component.closeModal, 'emit');
    
    component.onClose();
    
    expect(component.closeModal.emit).toHaveBeenCalled();
  });

  it('should show error when submitting without selecting a student', () => {
    component.selectedStudentId = '';
    
    component.onSubmit();
    
    expect(component.errorMessage).toBe('Please select a student.');
    expect(assignmentsService.create).not.toHaveBeenCalled();
  });

  it('should successfully assign student to teacher', () => {
    const mockAssignment = {
      id: 'assignment1',
      teacherId: 'teacher1',
      studentId: 'student1',
      createdAt: new Date()
    };
    
    assignmentsService.create.and.returnValue(of(mockAssignment));
    spyOn(component.studentAssigned, 'emit');
    spyOn(component.closeModal, 'emit');
    
    component.selectedStudentId = 'student1';
    component.onSubmit();
    
    expect(assignmentsService.create).toHaveBeenCalledWith({
      teacherId: 'teacher1',
      studentId: 'student1'
    });
    expect(component.studentAssigned.emit).toHaveBeenCalled();
    expect(component.closeModal.emit).toHaveBeenCalled();
  });

  it('should handle error when assigning student', () => {
    const error = { error: { message: 'Assignment already exists' } };
    assignmentsService.create.and.returnValue(throwError(() => error));
    
    component.selectedStudentId = 'student1';
    component.onSubmit();
    
    expect(component.errorMessage).toBe('Assignment already exists');
    expect(component.isSubmitting).toBe(false);
  });

  it('should return full name of student', () => {
    const fullName = component.getStudentFullName(mockStudents[0]);
    
    expect(fullName).toBe('John Doe');
  });
});


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
    const assignmentsServiceSpy = jasmine.createSpyObj('AssignmentsService', ['create', 'delete']);
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

  describe('Delete Assignment', () => {
    it('should delete assignment successfully', () => {
      const assignedStudent: Student = {
        ...mockStudents[0],
        assignmentId: 'assignment1'
      };
      
      component.assignedStudents = [assignedStudent];
      assignmentsService.delete.and.returnValue(of(undefined));
      spyOn(component.studentAssigned, 'emit');
      spyOn(window, 'confirm').and.returnValue(true);
      
      component.deleteAssignment(assignedStudent);
      
      expect(assignmentsService.delete).toHaveBeenCalledWith('assignment1');
      expect(component.assignedStudents.length).toBe(0);
      expect(component.studentAssigned.emit).toHaveBeenCalled();
    });

    it('should not delete assignment when user cancels confirmation', () => {
      const assignedStudent: Student = {
        ...mockStudents[0],
        assignmentId: 'assignment1'
      };
      
      component.assignedStudents = [assignedStudent];
      spyOn(window, 'confirm').and.returnValue(false);
      
      component.deleteAssignment(assignedStudent);
      
      expect(assignmentsService.delete).not.toHaveBeenCalled();
      expect(component.assignedStudents.length).toBe(1);
    });

    it('should handle error when deleting assignment', () => {
      const assignedStudent: Student = {
        ...mockStudents[0],
        assignmentId: 'assignment1'
      };
      
      const error = { error: { message: 'Failed to delete' } };
      assignmentsService.delete.and.returnValue(throwError(() => error));
      spyOn(window, 'confirm').and.returnValue(true);
      
      component.deleteAssignment(assignedStudent);
      
      expect(component.errorMessage).toBe('Failed to delete');
      expect(component.isDeletingAssignmentId).toBeNull();
    });

    it('should not delete when assignmentId is missing', () => {
      const assignedStudent: Student = {
        ...mockStudents[0]
        // No assignmentId
      };
      
      spyOn(console, 'error');
      
      component.deleteAssignment(assignedStudent);
      
      expect(console.error).toHaveBeenCalledWith('Cannot delete assignment: assignmentId is missing');
      expect(assignmentsService.delete).not.toHaveBeenCalled();
    });
  });

  describe('isStudentAlreadyAssigned', () => {
    it('should return true if student is already assigned', () => {
      const assignedStudent: Student = {
        ...mockStudents[0],
        assignmentId: 'assignment1'
      };
      
      component.assignedStudents = [assignedStudent];
      
      expect(component.isStudentAlreadyAssigned('1')).toBe(true);
    });

    it('should return false if student is not assigned', () => {
      component.assignedStudents = [];
      
      expect(component.isStudentAlreadyAssigned('1')).toBe(false);
    });
  });
});


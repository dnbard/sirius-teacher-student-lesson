import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { AddLessonModalComponent } from './add-lesson-modal.component';
import { LessonsService } from '../../services/lessons.service';

describe('AddLessonModalComponent', () => {
  let component: AddLessonModalComponent;
  let fixture: ComponentFixture<AddLessonModalComponent>;
  let lessonsService: jasmine.SpyObj<LessonsService>;

  beforeEach(async () => {
    const lessonsServiceSpy = jasmine.createSpyObj('LessonsService', ['create']);

    await TestBed.configureTestingModule({
      declarations: [AddLessonModalComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: LessonsService, useValue: lessonsServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddLessonModalComponent);
    component = fixture.componentInstance;
    lessonsService = TestBed.inject(LessonsService) as jasmine.SpyObj<LessonsService>;
    
    component.teachers = [
      { id: '1', name: 'John Doe', role: 'teacher' },
      { id: '2', name: 'Jane Smith', role: 'teacher' }
    ];
    component.students = [
      { id: '3', name: 'Alice Brown', role: 'student' },
      { id: '4', name: 'Bob Wilson', role: 'student' }
    ];
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit closeModal when onClose is called', () => {
    spyOn(component.closeModal, 'emit');
    component.onClose();
    expect(component.closeModal.emit).toHaveBeenCalled();
  });

  it('should validate that end time is after start time', () => {
    const form = component.lessonForm;
    form.patchValue({
      teacherId: '1',
      studentId: '3',
      startTime: '2024-12-31T14:00',
      endTime: '2024-12-31T13:00'
    });

    component.onSubmit();

    expect(component.errorMessage).toBe('End time must be after start time');
    expect(lessonsService.create).not.toHaveBeenCalled();
  });

  it('should create lesson successfully', () => {
    const mockLesson = { id: 'lesson-1' } as any;
    lessonsService.create.and.returnValue(of(mockLesson));

    spyOn(component.lessonCreated, 'emit');
    spyOn(component.closeModal, 'emit');

    const form = component.lessonForm;
    form.patchValue({
      teacherId: '1',
      studentId: '3',
      startTime: '2024-12-31T13:00',
      endTime: '2024-12-31T14:00'
    });

    component.onSubmit();

    expect(lessonsService.create).toHaveBeenCalled();
    expect(component.lessonCreated.emit).toHaveBeenCalled();
    expect(component.closeModal.emit).toHaveBeenCalled();
  });

  it('should handle error when creating lesson fails', () => {
    const error = { error: { message: 'Failed to create' } };
    lessonsService.create.and.returnValue(throwError(() => error));

    const form = component.lessonForm;
    form.patchValue({
      teacherId: '1',
      studentId: '3',
      startTime: '2024-12-31T13:00',
      endTime: '2024-12-31T14:00'
    });

    component.onSubmit();

    expect(component.errorMessage).toBe('Failed to create');
    expect(component.isSubmitting).toBe(false);
  });
});


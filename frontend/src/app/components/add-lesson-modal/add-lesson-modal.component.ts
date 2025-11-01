import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LessonsService } from '../../services/lessons.service';

interface UserOption {
  id: string;
  name: string;
  role: string;
}

@Component({
  selector: 'app-add-lesson-modal',
  templateUrl: './add-lesson-modal.component.html',
  styleUrls: ['./add-lesson-modal.component.scss']
})
export class AddLessonModalComponent {
  @Input() teachers: UserOption[] = [];
  @Input() students: UserOption[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() lessonCreated = new EventEmitter<void>();

  lessonForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private lessonsService: LessonsService
  ) {
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setMinutes(0, 0, 0);
    const defaultEnd = new Date(defaultStart);
    defaultEnd.setHours(defaultStart.getHours() + 1);

    this.lessonForm = this.fb.group({
      teacherId: ['', [Validators.required]],
      studentId: ['', [Validators.required]],
      startTime: [this.formatDateTimeLocal(defaultStart), [Validators.required]],
      endTime: [this.formatDateTimeLocal(defaultEnd), [Validators.required]]
    });
  }

  formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onSubmit(): void {
    if (this.lessonForm.invalid) {
      Object.keys(this.lessonForm.controls).forEach(key => {
        this.lessonForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formValue = this.lessonForm.value;

    // Validate time range
    const startTime = new Date(formValue.startTime);
    const endTime = new Date(formValue.endTime);

    if (endTime <= startTime) {
      this.errorMessage = 'End time must be after start time';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const lessonPayload = {
      teacherId: formValue.teacherId,
      studentId: formValue.studentId,
      startTime: new Date(formValue.startTime).toISOString(),
      endTime: new Date(formValue.endTime).toISOString()
    };

    this.lessonsService.create(lessonPayload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.lessonCreated.emit();
        this.onClose();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.message || 'Failed to create lesson. Please try again.';
        console.error('Error creating lesson:', error);
      }
    });
  }
}


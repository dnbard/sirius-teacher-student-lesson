import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TeachersService } from '../../services/teachers.service';
import { StudentsService } from '../../services/students.service';

@Component({
  selector: 'app-add-user-modal',
  templateUrl: './add-user-modal.component.html',
  styleUrls: ['./add-user-modal.component.scss']
})
export class AddUserModalComponent {
  @Output() closeModal = new EventEmitter<void>();
  @Output() userCreated = new EventEmitter<void>();

  userForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private teachersService: TeachersService,
    private studentsService: StudentsService
  ) {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['teacher', [Validators.required]],
      instrument: ['', [Validators.required]],
      experience: [0, [Validators.min(0)]]
    });

    // Watch role changes to update validation
    this.userForm.get('role')?.valueChanges.subscribe(role => {
      const experienceControl = this.userForm.get('experience');
      if (role === 'teacher') {
        experienceControl?.setValidators([Validators.required, Validators.min(0)]);
      } else {
        experienceControl?.clearValidators();
      }
      experienceControl?.updateValueAndValidity();
    });
  }

  get isTeacher(): boolean {
    return this.userForm.get('role')?.value === 'teacher';
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      Object.keys(this.userForm.controls).forEach(key => {
        this.userForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formValue = this.userForm.value;

    if (formValue.role === 'teacher') {
      const teacherPayload = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        password: formValue.password,
        instrument: formValue.instrument,
        experience: formValue.experience
      };
      this.teachersService.create(teacherPayload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.userCreated.emit();
          this.onClose();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = error.error?.message || 'Failed to create teacher. Please try again.';
          console.error('Error creating teacher:', error);
        }
      });
    } else {
      const studentPayload = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        password: formValue.password,
        instrument: formValue.instrument
      };
      this.studentsService.create(studentPayload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.userCreated.emit();
          this.onClose();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = error.error?.message || 'Failed to create student. Please try again.';
          console.error('Error creating student:', error);
        }
      });
    }
  }
}


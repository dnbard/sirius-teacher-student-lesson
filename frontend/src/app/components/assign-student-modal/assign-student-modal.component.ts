import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AssignmentsService } from '../../services/assignments.service';
import { StudentsService } from '../../services/students.service';
import { Student } from '../../models/student.model';

@Component({
  selector: 'app-assign-student-modal',
  templateUrl: './assign-student-modal.component.html',
  styleUrls: ['./assign-student-modal.component.scss']
})
export class AssignStudentModalComponent implements OnInit {
  @Input() teacherId!: string;
  @Input() teacherName!: string;
  @Output() closeModal = new EventEmitter<void>();
  @Output() studentAssigned = new EventEmitter<void>();

  students: Student[] = [];
  selectedStudentId: string = '';
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private assignmentsService: AssignmentsService,
    private studentsService: StudentsService
  ) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.studentsService.getAll().subscribe({
      next: (students) => {
        console.log('Loaded students:', students);
        this.students = students;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load students. Please try again.';
        this.isLoading = false;
        console.error('Error loading students:', error);
      }
    });
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onSubmit(): void {
    if (!this.selectedStudentId) {
      this.errorMessage = 'Please select a student.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    console.log('Assigning student:', {
      teacherId: this.teacherId,
      studentId: this.selectedStudentId
    });

    this.assignmentsService.create({
      teacherId: this.teacherId,
      studentId: this.selectedStudentId
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.studentAssigned.emit();
        this.onClose();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.message || 'Failed to assign student. Please try again.';
        console.error('Error assigning student:', error);
      }
    });
  }

  getStudentFullName(student: Student): string {
    return `${student.user.firstName} ${student.user.lastName}`;
  }
}


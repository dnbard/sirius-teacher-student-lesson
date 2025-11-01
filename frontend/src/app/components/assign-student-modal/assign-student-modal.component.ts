import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AssignmentsService, Assignment } from '../../services/assignments.service';
import { StudentsService } from '../../services/students.service';
import { TeachersService } from '../../services/teachers.service';
import { Student } from '../../models/student.model';

@Component({
  selector: 'app-assign-student-modal',
  templateUrl: './assign-student-modal.component.html',
  styleUrls: ['./assign-student-modal.component.scss']
})
export class AssignStudentModalComponent implements OnInit {
  @Input() teacherId!: string;
  @Input() teacherName!: string;
  @Input() assignedStudents: Student[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() studentAssigned = new EventEmitter<void>();

  students: Student[] = [];
  selectedStudentId: string = '';
  isLoading = false;
  isSubmitting = false;
  isDeletingAssignmentId: string | null = null;
  errorMessage = '';

  constructor(
    private assignmentsService: AssignmentsService,
    private studentsService: StudentsService,
    private teachersService: TeachersService
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

  deleteAssignment(student: Student): void {
    if (!student.assignmentId) {
      console.error('Cannot delete assignment: assignmentId is missing');
      return;
    }

    const confirmMessage = `Are you sure you want to remove "${this.getStudentFullName(student)}" from ${this.teacherName}?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    this.isDeletingAssignmentId = student.assignmentId;
    this.errorMessage = '';

    this.assignmentsService.delete(student.assignmentId).subscribe({
      next: () => {
        console.log('Assignment deleted successfully');
        this.isDeletingAssignmentId = null;
        // Remove from local list
        this.assignedStudents = this.assignedStudents.filter(s => s.id !== student.id);
        // Notify parent to refresh data
        this.studentAssigned.emit();
      },
      error: (error) => {
        this.isDeletingAssignmentId = null;
        this.errorMessage = error.error?.message || 'Failed to delete assignment. Please try again.';
        console.error('Error deleting assignment:', error);
      }
    });
  }

  isStudentAlreadyAssigned(studentId: string): boolean {
    return this.assignedStudents.some(s => s.id === studentId);
  }
}


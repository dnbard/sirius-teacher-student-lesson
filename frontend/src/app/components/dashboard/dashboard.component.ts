import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TeachersService } from '../../services/teachers.service';
import { StudentsService } from '../../services/students.service';
import { LessonsService } from '../../services/lessons.service';
import { User, UserRole } from '../../models/user.model';
import { Teacher } from '../../models/teacher.model';
import { Student } from '../../models/student.model';
import { Lesson } from '../../models/lesson.model';
import { forkJoin } from 'rxjs';

interface UserTableRow {
  id: string;
  name: string;
  role: 'teacher' | 'student';
  instrument: string;
  experience?: number;
  students?: Student[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  usersTableData: UserTableRow[] = [];
  lessons: Lesson[] = [];
  loading: boolean = false;
  UserRole = UserRole;
  showAddUserModal: boolean = false;
  showAssignStudentModal: boolean = false;
  showAddLessonModal: boolean = false;
  selectedTeacher: UserTableRow | null = null;

  constructor(
    private authService: AuthService,
    private teachersService: TeachersService,
    private studentsService: StudentsService,
    private lessonsService: LessonsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      
      // Load teachers, students, and lessons only for admin users
      if (user?.role === UserRole.ADMIN) {
        this.loadUsersData();
        this.loadLessons();
      }
    });
  }

  loadUsersData(): void {
    this.loading = true;
    
    forkJoin({
      teachers: this.teachersService.getAll(),
      students: this.studentsService.getAll()
    }).subscribe({
      next: ({ teachers, students }) => {
        this.usersTableData = this.mapToTableData(teachers, students);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users data:', error);
        this.loading = false;
      }
    });
  }

  private mapToTableData(teachers: Teacher[], students: Student[]): UserTableRow[] {
    const teacherRows: UserTableRow[] = teachers.map(teacher => ({
      id: teacher.id,
      name: `${teacher.user.firstName} ${teacher.user.lastName}`,
      role: 'teacher' as const,
      instrument: teacher.instrument,
      experience: teacher.experience,
      students: teacher.students || []
    }));

    const studentRows: UserTableRow[] = students.map(student => ({
      id: student.id,
      name: `${student.user.firstName} ${student.user.lastName}`,
      role: 'student' as const,
      instrument: student.instrument
    }));

    return [...teacherRows, ...studentRows];
  }

  loadLessons(): void {
    this.loading = true;
    
    this.lessonsService.getAll().subscribe({
      next: (lessons) => {
        this.lessons = lessons;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading lessons:', error);
        this.loading = false;
      }
    });
  }

  getLessonDuration(lesson: Lesson): string {
    const start = new Date(lesson.startTime);
    const end = new Date(lesson.endTime);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  formatLessonDate(lesson: Lesson): string {
    const start = new Date(lesson.startTime);
    const end = new Date(lesson.endTime);
    
    const dateStr = start.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    const startTime = start.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const endTime = end.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `${dateStr} ${startTime} - ${endTime}`;
  }

  get teachersForModal(): UserTableRow[] {
    return this.usersTableData.filter(u => u.role === 'teacher');
  }

  get studentsForModal(): UserTableRow[] {
    return this.usersTableData.filter(u => u.role === 'student');
  }

  openAddUserModal(): void {
    this.showAddUserModal = true;
  }

  closeAddUserModal(): void {
    this.showAddUserModal = false;
  }

  onUserCreated(): void {
    this.loadUsersData();
  }

  openAssignStudentModal(teacher: UserTableRow): void {
    console.log('Opening assign modal for teacher:', teacher);
    this.selectedTeacher = teacher;
    this.showAssignStudentModal = true;
  }

  closeAssignStudentModal(): void {
    this.showAssignStudentModal = false;
    this.selectedTeacher = null;
  }

  onStudentAssigned(): void {
    // Reload data to show updated student assignments
    console.log('Student assigned successfully');
    this.loadUsersData();
  }

  openAddLessonModal(): void {
    this.showAddLessonModal = true;
  }

  closeAddLessonModal(): void {
    this.showAddLessonModal = false;
  }

  onLessonCreated(): void {
    console.log('Lesson created successfully');
    this.loadLessons();
  }

  deleteUser(user: UserTableRow): void {
    // Show confirmation dialog
    const confirmMessage = `Are you sure you want to delete ${user.role} "${user.name}"? This action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    this.loading = true;

    const deleteObservable = user.role === 'teacher' 
      ? this.teachersService.delete(user.id)
      : this.studentsService.delete(user.id);

    deleteObservable.subscribe({
      next: () => {
        console.log(`${user.role} deleted successfully`);
        // Remove from local data
        this.usersTableData = this.usersTableData.filter(u => u.id !== user.id);
        this.loading = false;
      },
      error: (error) => {
        console.error(`Error deleting ${user.role}:`, error);
        alert(`Failed to delete ${user.role}. Please try again.`);
        this.loading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Logged out successfully');
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Even if the API fails, clear local auth data
        this.router.navigate(['/login']);
      }
    });
  }
}


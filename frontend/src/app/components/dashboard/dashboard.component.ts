import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TeachersService } from '../../services/teachers.service';
import { StudentsService } from '../../services/students.service';
import { User, UserRole } from '../../models/user.model';
import { Teacher } from '../../models/teacher.model';
import { Student } from '../../models/student.model';
import { forkJoin } from 'rxjs';

interface UserTableRow {
  id: string;
  name: string;
  role: 'teacher' | 'student';
  instrument: string;
  experience?: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  usersTableData: UserTableRow[] = [];
  loading: boolean = false;
  UserRole = UserRole;

  constructor(
    private authService: AuthService,
    private teachersService: TeachersService,
    private studentsService: StudentsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      
      // Load teachers and students only for admin users
      if (user?.role === UserRole.ADMIN) {
        this.loadUsersData();
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
      experience: teacher.experience
    }));

    const studentRows: UserTableRow[] = students.map(student => ({
      id: student.id,
      name: `${student.user.firstName} ${student.user.lastName}`,
      role: 'student' as const,
      instrument: student.instrument
    }));

    return [...teacherRows, ...studentRows];
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


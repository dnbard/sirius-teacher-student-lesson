import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Assignment {
  id: string;
  teacherId: string;
  studentId: string;
  createdAt: Date;
}

export interface CreateAssignmentDto {
  teacherId: string;
  studentId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AssignmentsService {
  private apiUrl = `${environment.apiUrl}/assignments`;

  constructor(private http: HttpClient) {}

  create(data: CreateAssignmentDto): Observable<Assignment> {
    return this.http.post<Assignment>(this.apiUrl, data, {
      withCredentials: true
    });
  }
}


import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Student } from '../models/student.model';

@Injectable({
  providedIn: 'root'
})
export class StudentsService {
  private apiUrl = `${environment.apiUrl}/students`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Student[]> {
    return this.http.get<Student[]>(this.apiUrl, {
      withCredentials: true
    });
  }

  getOne(id: string): Observable<Student> {
    return this.http.get<Student>(`${this.apiUrl}/${id}`, {
      withCredentials: true
    });
  }

  create(data: { firstName: string; lastName: string; email: string; password: string; instrument: string }): Observable<Student> {
    return this.http.post<Student>(this.apiUrl, data, {
      withCredentials: true
    });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      withCredentials: true
    });
  }
}


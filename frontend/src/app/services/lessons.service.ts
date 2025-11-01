import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Lesson } from '../models/lesson.model';

@Injectable({
  providedIn: 'root'
})
export class LessonsService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/lessons`, {
      withCredentials: true
    });
  }

  create(data: { teacherId: string; studentId: string; startTime: string; endTime: string }): Observable<Lesson> {
    return this.http.post<Lesson>(`${this.apiUrl}/lesson`, data, {
      withCredentials: true
    });
  }
}


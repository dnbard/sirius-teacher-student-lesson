import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Teacher } from '../models/teacher.model';

@Injectable({
  providedIn: 'root'
})
export class TeachersService {
  private apiUrl = `${environment.apiUrl}/teachers`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Teacher[]> {
    return this.http.get<Teacher[]>(this.apiUrl, {
      withCredentials: true
    });
  }

  getOne(id: string): Observable<Teacher> {
    return this.http.get<Teacher>(`${this.apiUrl}/${id}`, {
      withCredentials: true
    });
  }
}


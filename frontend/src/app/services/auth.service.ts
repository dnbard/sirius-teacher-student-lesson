import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse, User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;
  private tokenSubject: BehaviorSubject<string | null>;
  public token$: Observable<string | null>;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Initialize from localStorage
    const storedUser = localStorage.getItem('currentUser');
    const storedToken = localStorage.getItem('accessToken');
    
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.tokenSubject = new BehaviorSubject<string | null>(storedToken);
    
    this.currentUser$ = this.currentUserSubject.asObservable();
    this.token$ = this.tokenSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get tokenValue(): string | null {
    return this.tokenSubject.value;
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth`, credentials, {
      withCredentials: true // Important for cookies
    }).pipe(
      tap(response => {
        // Store user and token in localStorage
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        localStorage.setItem('accessToken', response.accessToken);
        
        // Update subjects
        this.currentUserSubject.next(response.user);
        this.tokenSubject.next(response.accessToken);
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/logout`, {}, {
      withCredentials: true
    }).pipe(
      tap(() => {
        this.clearAuthData();
        this.router.navigate(['/login']);
      })
    );
  }

  private clearAuthData(): void {
    // Clear localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessToken');
    
    // Clear subjects
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.currentUserValue;
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`, {
      withCredentials: true
    });
  }
}


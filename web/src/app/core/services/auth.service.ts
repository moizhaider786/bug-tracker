import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SignupDto } from '../dtos/auth/signup.dto';
import { LoginDto } from '../dtos/auth/login.dto';
import { User } from '../models/user.model';
import { UserRoles } from '../../types/types';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  constructor(private httpClient: HttpClient) {}

  signup(data: SignupDto): Observable<Omit<User, 'password'>> {
    return this.httpClient.post<Omit<User, 'password'>>(`${this.apiUrl}/signup`, data);
  }

  login(data: LoginDto): Observable<Omit<User, 'password'> & { access_token: string }> {
    return this.httpClient
      .post<
        Omit<User, 'password'> & { access_token: string }
      >(`${this.apiUrl}/login`, data, { withCredentials: true })
      .pipe(
        tap((res) => {
          const payload = { id: res.id, email: res.email, role: res.role };
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('user', JSON.stringify(payload));
        }),
      );
  }
  refreshToken() {
    return this.httpClient
      .post<{ access_token: string }>(`${this.apiUrl}/refresh`, {}, { withCredentials: true })
      .pipe(tap((res) => localStorage.setItem('access_token', res.access_token)));
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    return this.httpClient.post(`${this.apiUrl}/logout`, {}, { withCredentials: true });
  }
  getProfile(): Observable<User> {
    return this.httpClient.get<User>(`${this.apiUrl}/me`);
  }
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }
  getUser(): { id: number; role: UserRoles } | null {
    const user = localStorage.getItem('user');
    if (!user) return null;
    const parsedUser = JSON.parse(user);
    return parsedUser;
  }
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUser();
  }
  hasRole(role: string): boolean {
    const user = this.getUser();
    if (!user) return false;
    return role === user.role;
  }
}

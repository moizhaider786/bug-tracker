import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SignupDto } from '../dtos/auth/signup.dto';
import { LoginDto } from '../dtos/auth/login.dto';
import { User } from '../models/user.model';

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
      .post<Omit<User, 'password'> & { access_token: string }>(`${this.apiUrl}/login`, data)
      .pipe(
        tap((res) => {
          const payload = { id: res.id, email: res.email, role: res.role };
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('user', JSON.stringify(payload));
        }),
      );
  }
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }
  getProfile(): Observable<User> {
    return this.httpClient.get<User>(`${this.apiUrl}/me`);
  }
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }
  getUser(): string | null {
    return localStorage.getItem('user');
  }
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUser();
  }
  hasRole(role: string): boolean {
    const user = this.getUser();
    if (!user) return false;
    const parsedUser = JSON.parse(user);
    return role === parsedUser.role;
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { UserRoles } from '../../types/types';
import { GetUserProjectsAndBugsCountResponseDto } from '../dtos/user/get-user-projects-and-bugs-count.dto';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = `${environment.apiUrl}/user`;
  http = inject(HttpClient);

  getAllUsers(roles: UserRoles[]): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/all`, { params: { roles } });
  }
  getProjectsAndBugsCount(): Observable<GetUserProjectsAndBugsCountResponseDto> {
    return this.http.get<GetUserProjectsAndBugsCountResponseDto>(
      `${this.baseUrl}/projectsAndBugsCount`,
    );
  }
}

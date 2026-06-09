import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ProjectDto } from '../dtos/project/create-project.dto';
import { updateProjectDto } from '../dtos/project/update-project.dto';
import { environment } from '../../../environments/environment';
import { Project, MemberProject } from '../models/project.model';
import { User } from '../models/user.model';
import { UserRoles } from '../../types/types';
@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private baseUrl = `${environment.apiUrl}/project`;
  userProjects = signal<Project[]>([]);
  constructor(private http: HttpClient) {}

  createProject(data: ProjectDto): Observable<Project> {
    return this.http.post<Project>(this.baseUrl, data);
  }

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.baseUrl).pipe(
      tap((projects) => {
        this.userProjects.set(projects);
      }),
    );
  }

  getProjectDetails(id: number): Observable<Project | MemberProject> {
    return this.http.get<Project | MemberProject>(`${this.baseUrl}/${id}`);
  }

  updateProject(id: number, data: updateProjectDto): Observable<Project> {
    return this.http.patch<Project>(`${this.baseUrl}/${id}`, data);
  }
  addMembers(id: number, members: number[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/${id}/members`, { members });
  }
  removeMembers(id: number, members: number[]): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}/members`, {
      body: { members },
    });
  }

  getProjectMembers(id: number, role?: UserRoles): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/${id}/members`, {
      params: { ...(role && { role }) },
    });
  }
}

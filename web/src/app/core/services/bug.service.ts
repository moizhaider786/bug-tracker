import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Bug } from '../models/bug.model';
import { CreateBugDto } from '../dtos/bug/create-bug.dto';
import { GetBugsResponseDto } from '../dtos/bug/get-bug.dto';
import { DEFAULT_PAGE_SIZE } from '../../lib/constants';

@Injectable({ providedIn: 'root' })
export class BugService {
  private apiUrl = `${environment.apiUrl}/bug`;
  bugs = signal<Bug[]>([]);
  http = inject(HttpClient);

  createBug(data: CreateBugDto): Observable<Bug> {
    return this.http.post<Bug>(this.apiUrl, data);
  }

  getBugs(
    projectId?: number,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  ): Observable<GetBugsResponseDto[]> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);

    if (projectId) {
      params = params.set('projectId', projectId);
    }
    return this.http
      .get<GetBugsResponseDto[]>(this.apiUrl, { params })
      .pipe(tap((bugs) => this.bugs.set(bugs)));
  }

  getBugById(id: number): Observable<Bug> {
    return this.http.get<Bug>(`${this.apiUrl}/${id}`);
  }

  updateBug(id: number, data: Partial<CreateBugDto>): Observable<Bug> {
    return this.http.put<Bug>(`${this.apiUrl}/${id}`, data);
  }

  deleteBug(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  uploadScreenshot(bugId: number, file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/${bugId}/screenshot`, formData);
  }
}

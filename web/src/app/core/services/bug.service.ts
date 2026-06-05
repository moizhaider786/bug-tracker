import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Bug } from '../models/bug.model';
import { CreateBugDto } from '../dtos/bug/create-bug.dto';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BugService {
  private apiUrl = `${environment.apiUrl}/bug`;
  bugs = signal<Bug | null>(null);
  http = inject(HttpClient);

  createBug(data: CreateBugDto): Observable<Bug> {
    return this.http.post<Bug>(this.apiUrl, data);
  }
}

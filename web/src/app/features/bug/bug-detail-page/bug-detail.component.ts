import { Component, inject, OnChanges, input, signal, SimpleChanges, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {  RouterLink } from '@angular/router';
import { BugService } from '../../../core/services/bug.service';
import { Bug } from '../../../core/models/bug.model';
import { AuthService } from '../../../core/services/auth.service';
import { UserRoles } from '../../../types/types';

@Component({
  selector: 'app-bug-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './bug-detail.component.html',
  styleUrl: './bug-detail.component.css',
})
export class BugDetailComponent implements OnChanges {
  private bugService = inject(BugService);
  private authService = inject(AuthService);
  isQA = this.authService.hasRole(UserRoles.QA);
  isDev = this.authService.hasRole(UserRoles.DEVELOPER);

  bug = signal<Bug | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  bugId = input<number>();
  closeDetails = output();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bugId']) {
      if (this.bugId()) {
        this.loadBug(this.bugId()!);
      }
    }
  }

  private loadBug(id: number): void {
    this.isLoading.set(true);
    this.bugService.getBugById(id).subscribe({
      next: (b) => {
        this.bug.set(b);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message);
        this.isLoading.set(false);
      },
    });
  }
}

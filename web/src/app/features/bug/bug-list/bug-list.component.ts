import {
  Component,
  inject,
  input,
  OnChanges,
  SimpleChanges,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BugService } from '../../../core/services/bug.service';
import { AuthService } from '../../../core/services/auth.service';
import { Bug } from '../../../core/models/bug.model';
import { UserRoles } from '../../../types/types';

@Component({
  selector: 'app-bug-list',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './bug-list.component.html',
  styleUrl: './bug-list.component.css',
})
export class BugListComponent implements OnChanges {
  bugService = inject(BugService);
  authService = inject(AuthService);

  projectId = input.required<number>();

  bugs = signal<Bug[]>([]);
  isQA = this.authService.hasRole(UserRoles.QA);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && this.projectId()) {
      this.loadBugs();
    }
  }

  loadBugs(): void {
    this.bugService.getBugs(this.projectId()).subscribe({
      next: (bugs) => this.bugs.set(bugs),
      error: (err) =>
        alert('Error loading bugs: ' + (err.error?.message || err.message)),
    });
  }

  deleteBug(bugId: number): void {
    if (!confirm('Are you sure you want to delete this bug?')) return;
    this.bugService.deleteBug(bugId).subscribe({
      next: () => this.loadBugs(),
      error: (err) =>
        alert('Error deleting bug: ' + (err.error?.message || err.message)),
    });
  }
}

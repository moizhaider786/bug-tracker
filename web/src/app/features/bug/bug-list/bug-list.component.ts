import {
  Component,
  inject,
  input,
  OnChanges,
  SimpleChanges,
  signal,
  OnInit,
  effect,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BugService } from '../../../core/services/bug.service';
import { AuthService } from '../../../core/services/auth.service';
import { Bug } from '../../../core/models/bug.model';
import { UserRoles } from '../../../types/types';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-bug-list',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './bug-list.component.html',
  styleUrl: './bug-list.component.css',
})
export class BugListComponent implements OnChanges, OnInit {
  bugService = inject(BugService);
  authService = inject(AuthService);
  modalService = inject(ModalService);

  preloadedBugs = input<Bug[] | null>(null);
  projectId = input<number>(0);

  bugs = signal<Bug[]>([]);
  isQA = this.authService.hasRole(UserRoles.QA);
  isDev = this.authService.hasRole(UserRoles.DEVELOPER);

  constructor() {
    // Reacts every time preloadedBugs signal changes (including after API responds)
    effect(() => {
      const preloaded = this.preloadedBugs();
      if (preloaded !== null) {
        this.bugs.set(preloaded);
      }
    });
  }

  ngOnInit(): void {
    // Only self-fetch if no preloaded bugs AND a projectId is given
    if (this.preloadedBugs() === null && this.projectId()) {
      this.loadBugs();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.preloadedBugs() !== null) return;
    if (changes['projectId'] && this.projectId()) {
      this.loadBugs();
    }
  }

  loadBugs(): void {
    this.bugService.getBugs(this.projectId()).subscribe({
      next: (res) => this.bugs.set(res.data),
      error: (err) =>
        this.modalService.showError('Error loading bugs: ' + (err.error?.message || err.message)),
    });
  }

  deleteBug(bugId: number): void {
    if (!confirm('Are you sure you want to delete this bug?')) return;
    this.bugService.deleteBug(bugId).subscribe({
      next: () => {
        if (this.preloadedBugs() !== null) {
          this.bugs.update((list) => list.filter((b) => b.id !== bugId));
        } else {
          this.loadBugs();
        }
      },
      error: (err) =>
        this.modalService.showError('Error deleting bug: ' + (err.error?.message || err.message)),
    });
  }
}
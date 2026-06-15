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
import { BugDetailComponent } from '../bug-detail-page/bug-detail.component';
import { HttpErrorResponse } from '@angular/common/http';
import { DEFAULT_PAGE_SIZE } from '../../../lib/constants';
import { PaginationComponent } from '../../../core/components/pagination/pagination.component';

@Component({
  selector: 'app-bug-list',
  standalone: true,
  imports: [RouterLink, CommonModule, BugDetailComponent, PaginationComponent],
  templateUrl: './bug-list.component.html',
  styleUrl: './bug-list.component.css',
})
export class BugListComponent implements OnChanges, OnInit {
  bugService = inject(BugService);
  authService = inject(AuthService);
  modalService = inject(ModalService);

  projectId = input<number>(0);

  bugs = signal<Bug[]>([]);
  readonly pageSize = DEFAULT_PAGE_SIZE;

  total = signal<number>(0);
  currentPage = signal<number>(1);
  isQA = this.authService.hasRole(UserRoles.QA);
  isDev = this.authService.hasRole(UserRoles.DEVELOPER);

  selectedBugId = signal<number | undefined>(undefined);

  ngOnInit(): void {
    this.loadBugs(1);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && this.projectId()) {
      this.loadBugs(1);
    }
  }

  private loadBugs(page: number): void {
    this.bugService.getBugs(undefined, page, this.pageSize).subscribe({
      next: (res) => {
        this.bugs.set(res.data);
        this.total.set(res.total);
        this.currentPage.set(page);
      },
      error: (err: HttpErrorResponse) =>
        this.modalService.showError('Failed to load bugs: ' + (err.error?.message || err.message)),
    });
  }

  onPageChange(page: number): void {
    this.loadBugs(page);
  }

  deleteBug(bugId: number): void {
    if (!confirm('Are you sure you want to delete this bug?')) return;
    this.bugService.deleteBug(bugId).subscribe({
      next: () => {
        this.loadBugs(1);
      },
      error: (err) =>
        this.modalService.showError('Error deleting bug: ' + (err.error?.message || err.message)),
    });
  }
  closeBugDetails() {
    this.selectedBugId.set(undefined);
  }
}

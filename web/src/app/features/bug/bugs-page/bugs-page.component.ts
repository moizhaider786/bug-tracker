import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BugListComponent } from '../bug-list/bug-list.component';
import { PaginationComponent } from '../../../core/components/pagination/pagination.component';
import { BugService } from '../../../core/services/bug.service';
import { Bug } from '../../../core/models/bug.model';
import { HttpErrorResponse } from '@angular/common/http';
import { ModalService } from '../../../core/services/modal.service';
import { DEFAULT_PAGE_SIZE } from '../../../lib/constants';

interface ProjectGroup {
  projectId: number;
  projectName: string;
  bugs: Bug[];
}

@Component({
  selector: 'app-bugs-page',
  standalone: true,
  imports: [CommonModule, FormsModule, BugListComponent, PaginationComponent],
  templateUrl: './bugs-page.component.html',
  styleUrl: './bugs-page.component.css',
})
export class BugsPageComponent implements OnInit {
  private bugService = inject(BugService);
  private modalService = inject(ModalService);

  readonly pageSize = DEFAULT_PAGE_SIZE;

  allBugs = signal<Bug[]>([]);
  total = signal<number>(0);
  currentPage = signal<number>(1);
  selectedProjectId = signal<number | null>(null);

  projectsWithBugs = computed(() => {
    const seen = new Map<number, string>();
    for (const bug of this.allBugs()) {
      if (!seen.has(bug.projectId)) {
        seen.set(bug.projectId, bug?.project?.name || '');
      }
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  });

  groupedBugs = computed<ProjectGroup[]>(() => {
    const sel = this.selectedProjectId();
    const bugs = sel ? this.allBugs().filter((b) => b.projectId === Number(sel)) : this.allBugs();

    const map = new Map<number, ProjectGroup>();
    for (const bug of bugs) {
      if (!map.has(bug.projectId)) {
        map.set(bug.projectId, {
          projectId: bug.projectId,
          projectName: bug.project?.name || '',
          bugs: [],
        });
      }
      map.get(bug.projectId)!.bugs.push(bug);
    }
    return [...map.values()];
  });

  ngOnInit(): void {
    this.loadBugs(1);
  }

  private loadBugs(page: number): void {
    this.bugService.getBugs(undefined, page, this.pageSize).subscribe({
      next: (res) => {
        this.allBugs.set(res.data);
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
}

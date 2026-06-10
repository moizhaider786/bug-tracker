import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BugListComponent } from '../bug-list/bug-list.component';
import { BugService } from '../../../core/services/bug.service';
import { ProjectService } from '../../../core/services/project.service';
import { Bug } from '../../../core/models/bug.model';
import { HttpErrorResponse } from '@angular/common/http';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-bugs-page',
  standalone: true,
  imports: [CommonModule, FormsModule, BugListComponent],
  templateUrl: './bugs-page.component.html',
  styleUrl: './bugs-page.component.css',
})
export class BugsPageComponent implements OnInit {
  private bugService = inject(BugService);
  private projectService = inject(ProjectService);
  private modalService = inject(ModalService);

  allBugs = signal<Bug[]>([]);
  selectedProjectId = signal<number | null>(null);
  projectsWithBugs = computed(() => {
    const projects = this.projectService.userProjects();
    const seen = new Map<number, string>();
    for (const bug of this.allBugs()) {
      if (!seen.has(bug.projectId)) {
        const name =
          projects.find((p) => p.id === bug.projectId)?.name ?? `Project #${bug.projectId}`;
        seen.set(bug.projectId, name);
      }
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  });

  groupedBugs = computed(() => {
    const selId = this.selectedProjectId();
    const bugs = selId
      ? this.allBugs().filter((b) => b.projectId === Number(selId))
      : this.allBugs();

    const projects = this.projectService.userProjects();
    const map = new Map<number, Bug[]>();
    for (const bug of bugs) {
      if (!map.has(bug.projectId)) map.set(bug.projectId, []);
      map.get(bug.projectId)!.push(bug);
    }

    return [...map.entries()].map(([projectId, projectBugs]) => ({
      projectId,
      projectName: projects.find((p) => p.id === projectId)?.name ?? `Project #${projectId}`,
      bugs: projectBugs,
    }));
  });

  ngOnInit(): void {
    this.bugService.getBugs().subscribe({
      next: (bugs) => this.allBugs.set(bugs),
      error: (err) => this.modalService.showError('Failed to load bugs: ' + (err.error?.message || err.message)),
    });

    if (!this.projectService.userProjects().length) {
      this.projectService.getProjects().subscribe({
        error: (error: HttpErrorResponse) => {
          this.modalService.showError(error.error.message || 'Failed to load projects');
        },
      });
    }
  }
}

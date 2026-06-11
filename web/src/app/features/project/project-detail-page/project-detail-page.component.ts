import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { BugService } from '../../../core/services/bug.service';
import { Project } from '../../../core/models/project.model';
import { User } from '../../../core/models/user.model';
import { Bug } from '../../../core/models/bug.model';
import { UserRoles } from '../../../types/types';
import { BugListComponent } from '../../bug/bug-list/bug-list.component';
import { PaginationComponent } from '../../../core/components/pagination/pagination.component';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../../core/services/modal.service';
import { DEFAULT_PAGE_SIZE } from '../../../lib/constants';

@Component({
  selector: 'app-project-detail-page',
  standalone: true,
  imports: [BugListComponent, PaginationComponent, CommonModule, RouterLink],
  templateUrl: './project-detail-page.component.html',
  styleUrl: './project-detail-page.component.css',
})
export class ProjectDetailPageComponent implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private bugService = inject(BugService);
  projectService = inject(ProjectService);
  authService = inject(AuthService);
  modalService = inject(ModalService);

  readonly pageSize = DEFAULT_PAGE_SIZE;

  project = signal<Project | null>(null);
  projectMembers = signal<User[]>([]);
  projectId = signal<number>(0);

  bugs = signal<Bug[]>([]);
  bugsTotal = signal<number>(0);
  bugsPage = signal<number>(1);

  isQA = this.authService.hasRole(UserRoles.QA);

  ngOnInit(): void {
    this.activatedRoute.params.subscribe({
      next: (params) => {
        const id = +params['id'];
        this.projectId.set(id);
        this.bugsPage.set(1);

        this.projectService.getProjectDetails(id).subscribe({
          next: (project) => this.project.set(project),
          error: (err) =>
            this.modalService.showError(
              'Error: ' + (err.error?.message || 'Failed to load project details')
            ),
        });

        this.projectService.getProjectMembers(id).subscribe({
          next: (members) => this.projectMembers.set(members),
          error: (err) =>
            this.modalService.showError(
              'Error: ' + (err.error?.message || 'Failed to load project members')
            ),
        });

        this.loadBugs(id, 1);
      },
    });
  }

  loadBugs(projectId: number, page: number): void {
    this.bugService.getBugs(projectId, page, DEFAULT_PAGE_SIZE).subscribe({
      next: (res) => {
        this.bugs.set(res.data);
        this.bugsTotal.set(res.total);
      },
      error: (err) =>
        this.modalService.showError(
          'Error: ' + (err.error?.message || 'Failed to load bugs')
        ),
    });
  }

  onPageChange(page: number): void {
    this.bugsPage.set(page);
    this.loadBugs(this.projectId(), page);
  }
}
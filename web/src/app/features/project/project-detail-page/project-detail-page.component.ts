import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project } from '../../../core/models/project.model';
import { User } from '../../../core/models/user.model';
import { UserRoles } from '../../../types/types';
import { BugListComponent } from '../../bug/bug-list/bug-list.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project-detail-page',
  standalone: true,
  imports: [BugListComponent, RouterLink, CommonModule],
  templateUrl: './project-detail-page.component.html',
  styleUrl: './project-detail-page.component.css',
})
export class ProjectDetailPageComponent implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  projectService = inject(ProjectService);
  authService = inject(AuthService);

  project = signal<Project | null>(null);
  projectMembers = signal<User[]>([]);
  projectId = signal<number>(0);

  isQA = this.authService.hasRole(UserRoles.QA);

  ngOnInit(): void {
    this.activatedRoute.params.subscribe({
      next: (params) => {
        const id = +params['id'];
        this.projectId.set(id);

        this.projectService.getProjectDetails(id).subscribe({
          next: (project) => this.project.set(project),
          error: (err) =>
            alert('Error: ' + (err.error?.message || 'Failed to load project details')),
        });

        this.projectService.getProjectMembers(id).subscribe({
          next: (members) => this.projectMembers.set(members),
          error: (err) =>
            alert('Error: ' + (err.error?.message || 'Failed to load project members')),
        });
      },
    });
  }
}

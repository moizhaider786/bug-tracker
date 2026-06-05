import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-project-detail-page',
  imports: [],
  templateUrl: './project-detail-page.component.html',
  styleUrl: './project-detail-page.component.css',
})
export class ProjectDetailPageComponent implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  projectService = inject(ProjectService);
  project = signal<Project | null>(null);
  projectMembers = signal<User[]>([]);
  ngOnInit(): void {
    this.activatedRoute.params.subscribe({
      next: (params) => {
        const projectId = +params['id'];
        this.projectService.getProjectDetails(projectId).subscribe({
          next: (project) => {
            this.project.set(project);
          },
          error: (err) => alert('Error:' + err.error?.message || 'Failed to load project details'),
        });

        this.projectService.getProjectMembers(projectId).subscribe({
          next: (members) => {
            this.projectMembers.set(members);
          },
          error: (err) => alert('Error:' + err.error?.message || 'Failed to load project members'),
        });
      },
    });
  }
}

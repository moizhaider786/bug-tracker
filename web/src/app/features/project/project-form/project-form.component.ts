import { Component, input, inject, OnChanges, SimpleChanges, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserRoles } from '../../../types/types';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-project-form',
  imports: [FormsModule],
  templateUrl: './project-form.component.html',
  styleUrl: './project-form.component.css',
})
export class ProjectFormComponent implements OnChanges, OnInit {
  isEditForm = input<boolean>();
  editProjectId = input<number | null>();
  projectService = inject(ProjectService);
  projectFormData = {
    name: '',
    description: '',
  };
  authService = inject(AuthService);
  isAuthorized = signal<boolean>(true);
  isSubmitted = signal<boolean>(false);
  ngOnInit(): void {
    if (!this.authService.hasRole(UserRoles.MANAGER)) this.isAuthorized.set(false);
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editProjectId'] && this.isEditForm() && this.editProjectId()) {
      this.projectService.getProjectDetails(this.editProjectId()!).subscribe({
        next: (project) => {
          this.projectFormData = {
            name: project.name,
            description: project.description,
          };
        },
        error: (err) => alert('Failed to load project details: ' + err.message),
      });
    }
  }

  onSubmit() {
    if (this.isSubmitted()) return;
    this.isSubmitted.set(true);
    if (this.isEditForm()) {
      this.projectService.updateProject(this.editProjectId()!, this.projectFormData).subscribe({
        next: () => {
          alert('Project updated successfully!');
          this.refreshProjectsList();
          this.isSubmitted.set(false);
        },
        error: (err: HttpErrorResponse) => {
          alert(err.error.message || 'Failed to update project');
          this.isSubmitted.set(false);
        },
      });
    } else {
      this.projectService.createProject(this.projectFormData).subscribe({
        next: () => {
          alert('Project created successfully!');
          this.isSubmitted.set(false);
          this.refreshProjectsList();
        },
        error: (err: HttpErrorResponse) => {
          alert(err.error.message || 'Failed to create project');
          this.isSubmitted.set(false);
        },
      });
    }
  }

  private refreshProjectsList() {
    this.projectService.getProjects().subscribe({
      error: (err) => alert('Error refreshing projects list: ' + err.message),
    });
  }
}

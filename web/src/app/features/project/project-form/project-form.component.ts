import { Component, input, inject, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';

@Component({
  selector: 'app-project-form',
  imports: [FormsModule],
  templateUrl: './project-form.component.html',
  styleUrl: './project-form.component.css',
})
export class ProjectFormComponent implements OnChanges {
  isEditForm = input<boolean>();
  editProjectId = input<number | null>();
  projectService = inject(ProjectService);
  projectFormData = {
    name: '',
    description: '',
  };

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
    if (this.isEditForm()) {
      this.projectService.updateProject(this.editProjectId()!, this.projectFormData).subscribe({
        next: () => {
          alert('Project updated successfully!');
          this.refreshProjectsList();
        },
        error: (err) => alert('Failed to update project: ' + err.message),
      });
    } else {
      this.projectService.createProject(this.projectFormData).subscribe({
        next: () => {
          alert('Project created successfully!');
          this.refreshProjectsList();
        },
        error: (err) => alert('Failed to create project: ' + err.message),
      });
    }
  }

  private refreshProjectsList() {
    this.projectService.getProjects().subscribe({
      error: (err) => alert('Error refreshing projects list: ' + err.message),
    });
  }
}

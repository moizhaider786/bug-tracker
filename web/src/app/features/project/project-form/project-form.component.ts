import { Component, input, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';

@Component({
  selector: 'app-project-form',
  imports: [FormsModule],
  templateUrl: './project-form.component.html',
  styleUrl: './project-form.component.css',
})
export class ProjectFormComponent implements OnInit {
  isEditForm = input<boolean>();
  editProjectId = input<number | null>();
  projectService = inject(ProjectService);
  projectFormData = {
    name: '',
    description: '',
  };

  ngOnInit(): void {
    if (this.isEditForm()) {
      this.projectService.getProjectDetails(this.editProjectId()!).subscribe((project) => {
        this.projectFormData = {
          name: project.name,
          description: project.description,
        };
      });
    }
  }

  onSubmit() {
    if (this.isEditForm()) {
      this.projectService.updateProject(this.editProjectId()!, this.projectFormData).subscribe({
        next: (updatedProject) => {
          alert('Project updated successfully!');
        },
        error: (err) => {
          alert('Failed to update project: ' + err.message);
        },
      });
    } else {
      this.projectService.createProject(this.projectFormData).subscribe({
        next: (newProject) => {
          alert('Project created successfully!');
        },
        error: (err) => {
          alert('Failed to create project: ' + err.message);
        },
      });
    }
    this.projectService.getProjects().subscribe({
      error: (err) => alert('Error fetching projects: ' + err.message),
    });
  }
}

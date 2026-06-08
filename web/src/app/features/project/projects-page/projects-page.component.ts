import { Component, inject, signal } from '@angular/core';
import { ProjectListComponent } from '../project-list/project-list.component';
import { ProjectFormComponent } from '../project-form/project-form.component';
import { AuthService } from '../../../core/services/auth.service';
import { UserRoles } from '../../../types/types';
@Component({
  selector: 'app-projects-page',
  imports: [ProjectFormComponent, ProjectListComponent],
  templateUrl: './projects-page.component.html',
  styleUrl: './projects-page.component.css',
})
export class ProjectsPageComponent {
  isProjectFormVisible = signal(false);
  isEditProjectForm = signal(false);
  editProjectId = signal<number | null>(null);
  authService = inject(AuthService)
  userRole = UserRoles;

  closeProjectForm() {
    this.isProjectFormVisible.set(false);
    this.isEditProjectForm.set(false);
    this.editProjectId.set(null);
  }
  
  openProjectForm(isEdit: boolean, projectId?: number) {
    this.isProjectFormVisible.set(true);
    this.isEditProjectForm.set(isEdit);
    this.editProjectId.set(projectId || null);
  }

  editProject(projectId: number) {
    this.openProjectForm(true, projectId);
  }

}

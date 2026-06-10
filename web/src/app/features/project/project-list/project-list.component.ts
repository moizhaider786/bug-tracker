import { Component, inject, signal, output, OnInit } from '@angular/core';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { UserRoles } from '../../../types/types';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css',
})
export class ProjectListComponent implements OnInit {
  projectService = inject(ProjectService);
  editProject = output<number>();
  projectDetails = output<number>();
  authService = inject(AuthService);
  modalService = inject(ModalService);
  userRoles = UserRoles

  ngOnInit() {
    this.projectService.getProjects().subscribe({
      error: (err: HttpErrorResponse) => this.modalService.showError(err.error.message || 'Error fetching projects'),
    });
  }
}

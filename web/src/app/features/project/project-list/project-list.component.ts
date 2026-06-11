import { Component, inject, output, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ProjectService } from '../../../core/services/project.service';
import { DEFAULT_PAGE_SIZE } from '../../../lib/constants';
import { AuthService } from '../../../core/services/auth.service';
import { ModalService } from '../../../core/services/modal.service';
import { UserRoles } from '../../../types/types';
import { PaginationComponent } from '../../../core/components/pagination/pagination.component';
@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [RouterLink, PaginationComponent],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css',
})
export class ProjectListComponent implements OnInit {
  projectService = inject(ProjectService);
  authService    = inject(AuthService);
  modalService   = inject(ModalService);

  editProject = output<number>();
  userRoles = UserRoles;

  currentPage = 1;
  pageSize    = DEFAULT_PAGE_SIZE;

  ngOnInit() {
    this.load();
  }

  refresh() {
    this.currentPage = 1;
    this.load();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private load() {
    this.projectService.getProjects(this.currentPage, this.pageSize).subscribe({
      error: (err: HttpErrorResponse) =>
        this.modalService.showError(err.error?.message ?? 'Error fetching projects'),
    });
  }
}
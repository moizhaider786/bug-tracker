import { Component, inject, signal, output, OnInit } from '@angular/core';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';
@Component({
  selector: 'app-project-list',
  imports: [],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css',
})
export class ProjectListComponent implements OnInit {
  projectService = inject(ProjectService);
  editProject = output<number>();
  addMembers = output<number>();
  removeMembers = output<number>();
  projectDetails = output<number>();

  ngOnInit() {
    this.projectService.getProjects().subscribe({
      error: (err) => console.error('Error fetching projects:', err),
    });
  }
}

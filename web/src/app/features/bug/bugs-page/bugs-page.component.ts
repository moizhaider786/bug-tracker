import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BugListComponent } from '../bug-list/bug-list.component';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-bugs-page',
  standalone: true,
  imports: [CommonModule, FormsModule, BugListComponent],
  templateUrl: './bugs-page.component.html',
  styleUrl: './bugs-page.component.css',
})
export class BugsPageComponent implements OnInit {
  private projectService = inject(ProjectService);

  projects = signal<Project[]>([]);
  selectedProjectId = signal<number | null>(null);

  filteredProjects = computed(() => {
    const selId = this.selectedProjectId();
    const all = this.projects();
    if (selId === null || selId === undefined || String(selId) === 'null') {
      return all;
    }
    return all.filter((p) => p.id === Number(selId));
  });

  ngOnInit(): void {
    this.projectService.getProjects().subscribe({
      next: (projs) => {
        this.projects.set(projs);
      },
      error: (err) => {
        alert('Failed to load projects: ' + (err.error?.message || err.message));
      },
    });
  }
}

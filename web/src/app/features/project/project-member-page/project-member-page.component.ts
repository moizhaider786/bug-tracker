import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProjectMemberFormComponent } from '../project-member-form/project-member-form.component';

@Component({
  selector: 'app-project-member-page',
  standalone: true,
  imports: [ProjectMemberFormComponent],
  template: `
    <div class="page-container">
      <h1>{{ isAddForm() ? 'Add Members to Project' : 'Remove Members from Project' }}</h1>
      <app-project-member-form [isAddForm]="isAddForm()" [projectId]="projectId()"></app-project-member-form>
    </div>
  `,
  styles: [
    `
      .page-container {
        padding: 1rem;
      }
      h1 {
        margin-bottom: 1rem;
      }
    `
  ]
})
export class ProjectMemberPageComponent implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  isAddForm = signal<boolean>(true);
  projectId = signal<number>(0);

  ngOnInit() {
    this.activatedRoute.url.subscribe({
      next: (url) => {
        const path = url[url.length - 1].path.toLowerCase();
        this.isAddForm.set(path === 'add-members');
      },
    });
    this.activatedRoute.params.subscribe({
      next: (params) => {
        if(params['id']) {
          this.projectId.set(+params['id']);
        }
      }
    });
  }
}

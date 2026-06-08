import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BugFormComponent } from '../bug-form/bug-form.component';

@Component({
  selector: 'app-bug-form-page',
  standalone: true,
  imports: [BugFormComponent],
  template: `
    <div class="page-container">
      <h1>{{ isEditMode() ? 'Edit Bug' : 'Report a Bug' }}</h1>
      <app-bug-form
        [projectId]="projectId()"
        [bugId]="bugId()"
        [isEditMode]="isEditMode()"
      ></app-bug-form>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; }
    h1 { margin-bottom: 1.5rem; color: var(--color-text); }
  `],
})
export class BugFormPageComponent implements OnInit {
  private route = inject(ActivatedRoute);

  projectId = signal<number>(0);
  bugId = signal<number | null>(null);
  isEditMode = signal<boolean>(false);

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['projectId']) this.projectId.set(+params['projectId']);
      if (params['bugId']) {
        this.bugId.set(+params['bugId']);
        this.isEditMode.set(true);
      }
    });
  }
}

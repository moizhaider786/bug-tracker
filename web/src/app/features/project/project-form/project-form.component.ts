import { Component, input, inject, OnChanges, SimpleChanges, signal, OnInit, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserRoles } from '../../../types/types';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-project-form',
  imports: [ReactiveFormsModule],
  templateUrl: './project-form.component.html',
  styleUrl: './project-form.component.css',
})
export class ProjectFormComponent implements OnChanges, OnInit {
  isEditForm = input<boolean>();
  editProjectId = input<number | null>();

  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  closeeProjectForm = output<void>()

  isAuthorized = signal<boolean>(true);
  isSubmitted = signal<boolean>(false);

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
  });

  ngOnInit(): void {
    if (!this.authService.hasRole(UserRoles.MANAGER)) {
      this.isAuthorized.set(false);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editProjectId'] && this.isEditForm() && this.editProjectId()) {
      this.projectService.getProjectDetails(this.editProjectId()!).subscribe({
        next: (project) => {
          this.form.patchValue({
            name: project.name,
            description: project.description,
          });
        },
        error: (err) => alert('Failed to load project details: ' + err.message),
      });
    }
  }

  onSubmit(): void {
    if (this.isSubmitted() || this.form.invalid) return;

    this.form.disable(); // prevents double-submit more reliably than a flag
    const payload = this.form.getRawValue();

    const request$ = this.isEditForm()
      ? this.projectService.updateProject(this.editProjectId()!, payload)
      : this.projectService.createProject(payload);

    request$.subscribe({
      next: () => {
        alert(this.isEditForm() ? 'Project updated successfully!' : 'Project created successfully!');
        this.refreshProjectsList();
        this.form.enable();
        this.isSubmitted.set(false);
        this.closeeProjectForm.emit()
      },
      error: (err: HttpErrorResponse) => {
        alert(err.error.message || 'Failed to save project');
        this.form.enable();
        this.isSubmitted.set(false);
      },
    });
  }

  private refreshProjectsList(): void {
    this.projectService.getProjects().subscribe({
      error: (err) => alert('Error refreshing projects list: ' + err.message),
    });
  }
}
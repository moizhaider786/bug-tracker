import {
  Component,
  inject,
  input,
  OnInit,
  OnChanges,
  SimpleChanges,
  signal,
  computed,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BugService } from '../../../core/services/bug.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { BugStatus, BugType, UserRoles } from '../../../types/types';
import { toTimelineSeconds, fromTimelineSeconds } from '../../../lib/utility';
import { finalize } from 'rxjs';
import { ProjectService } from '../../../core/services/project.service';

@Component({
  selector: 'app-bug-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './bug-form.component.html',
  styleUrl: './bug-form.component.css',
})
export class BugFormComponent implements OnInit, OnChanges {
  projectId = input.required<number>();
  bugId = input<number | null>(null);
  isEditMode = input<boolean>(false);

  fb = inject(FormBuilder);
  bugService = inject(BugService);
  userService = inject(UserService);
  authService = inject(AuthService);
  projectService = inject(ProjectService);
  router = inject(Router);

  developers = signal<User[]>([]);
  selectedFile = signal<File | null>(null);
  createdBugId = signal<number | null>(null);
  isSubmitting = signal(false);
  fileError = signal<string | null>(null);

  formType = signal<BugType>(BugType.BUG);

  bugStatusOptions = computed(() => {
    const all = Object.values(BugStatus);
    if (this.formType() === BugType.BUG)
      return all.filter((status) => status !== BugStatus.COMPLETED);
    if (this.formType() === BugType.FEATURE)
      return all.filter((status) => status !== BugStatus.RESOLVED);
    return all;
  });

  bugTypeOptions = Object.values(BugType);

  // Role flags — set once in ngOnInit
  isDeveloper = false;
  isQA = false;

  form!: FormGroup;

  ngOnInit(): void {
    const currentUser = JSON.parse(this.authService.getUser()!);
    this.isDeveloper = currentUser.role === UserRoles.DEVELOPER;
    this.isQA = currentUser.role === UserRoles.QA;

    if (this.isDeveloper) {
      this.form = this.fb.group({
        status: [BugStatus.NEW, Validators.required],
        hours: [null, Validators.min(0)],
        minutes: [null, Validators.min(0)],
      });
    } else {
      this.form = this.fb.group({
        title: ['', [Validators.required, Validators.maxLength(280)]],
        description: ['', Validators.required],
        status: [BugStatus.NEW, Validators.required],
        type: [BugType.BUG, Validators.required],
        deadline: [null],
        developerId: [null, Validators.required],
        projectId: [this.projectId()],
        createdBy: [currentUser.id],
      });

      this.projectService.getProjectMembers(this.projectId(), UserRoles.DEVELOPER).subscribe({
        next: (users) => this.developers.set(users),
        error: (err) => alert('Failed to load developers: ' + (err.error?.message || err.message)),
      });

      this.form.get('type')!.valueChanges.subscribe((val) => this.formType.set(val));
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bugId'] && this.isEditMode() && this.bugId()) {
      this.bugService.getBugById(this.bugId()!).subscribe({
        next: (bug) => {
          if (this.isDeveloper) {
            const { hours, minutes } = fromTimelineSeconds(bug.timelineSeconds);
            this.form.patchValue({
              status: bug.status,
              type: bug.type,
              hours,
              minutes,
            });
          } else {
            this.form.patchValue({
              title: bug.title,
              description: bug.description,
              status: bug.status,
              type: bug.type,
              deadline: bug.deadline ? new Date(bug.deadline).toISOString().split('T')[0] : null,
              developerId: bug.developerId,
            });
          }
          this.createdBugId.set(bug.id);
        },
        error: (err) => alert('Failed to load bug: ' + (err.error?.message || err.message)),
      });
    }

    if (changes['projectId'] && this.form && !this.isDeveloper) {
      this.form.patchValue({ projectId: this.projectId() });
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files?.[0];
      if (!file) return;

      const allowed = ['image/png', 'image/gif'];

      if (!allowed.includes(file.type)) {
        input.value = ''; // reset the input
        this.selectedFile.set(null);
        this.fileError.set('Only PNG and GIF files are allowed.');
        return;
      }
      this.fileError.set(null);
      this.selectedFile.set(input.files[0]);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    if (this.isDeveloper && this.bugId()) {
      const payload = {
        status: this.form.value.status,
        timelineSeconds: toTimelineSeconds(this.form.value.hours, this.form.value.minutes),
      };
      this.bugService.updateBug(this.bugId()!, payload).subscribe({
        next: () => {
          alert('Bug updated Successfully');
          this.navigateBack();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          alert(err.error?.message || err.message || 'Failed to update bug: ');
        },
      });
      return;
    }

    const data = { ...this.form.value, timelineSeconds: 0 };

    if (this.createdBugId() && !this.isEditMode()) {
      this.isSubmitting.set(true);
      this.uploadScreenshotIfSelected(this.createdBugId()!);
      return;
    }

    if (this.isEditMode() && this.bugId()) {
      this.bugService
        .updateBug(this.bugId()!, data)
        .pipe(
          finalize(() => {
            alert('bug updated successfully');
            this.navigateBack();
          }),
        )
        .subscribe({
          next: (bug) => {
            this.uploadScreenshotIfSelected(bug.id);
          },
          error: (err) => {
            this.isSubmitting.set(false);
            alert('Failed to update bug: ' + (err.error?.message || err.message));
          },
        });
    } else {
      this.bugService.createBug(data).subscribe({
        next: (bug) => {
          this.createdBugId.set(bug.id);
          this.isSubmitting.set(false);
          alert('Bug created successfully! You can now upload a screenshot.');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          alert('Failed to create bug: ' + (err.error?.message || err.message));
        },
      });
    }
  }

  private uploadScreenshotIfSelected(bugId: number): void {
    if (this.selectedFile()) {
      this.bugService.uploadScreenshot(bugId, this.selectedFile()!).subscribe({
        next: () => {
          if (!this.isEditMode()) {
            alert('Screenshot added successfully');
          }
          this.navigateBack();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          alert('Bug saved but screenshot upload failed: ' + (err.error?.message || err.message));
          this.navigateBack();
        },
      });
    }
  }

  navigateBack(): void {
    this.isSubmitting.set(false);
    this.router.navigate(['/projects', this.projectId()]);
  }
}

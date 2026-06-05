import {
  Component,
  inject,
  input,
  OnInit,
  OnChanges,
  SimpleChanges,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BugService } from '../../../core/services/bug.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { BugStatus, BugType, UserRoles } from '../../../types/types';

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
  router = inject(Router);

  developers = signal<User[]>([]);
  selectedFile = signal<File | null>(null);
  createdBugId = signal<number | null>(null);
  isSubmitting = signal(false);

  bugStatusOptions = Object.values(BugStatus);
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
      // Developer can only update status + timeline
      this.form = this.fb.group({
        status: [BugStatus.NEW, Validators.required],
        timeline: ['00:00'],   // HH:MM — converted to/from seconds
      });
    } else {
      // QA: create or edit a bug (no timeline)
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

      // Only QA needs the developer list
      this.userService.getAllUsers([UserRoles.DEVELOPER]).subscribe({
        next: (users) => this.developers.set(users),
        error: (err) =>
          alert('Failed to load developers: ' + (err.error?.message || err.message)),
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bugId'] && this.isEditMode() && this.bugId()) {
      this.bugService.getBugById(this.bugId()!).subscribe({
        next: (bug) => {
          if (this.isDeveloper) {
            console.log("ran")
            this.form.patchValue({
              status: bug.status,
              timeline: this.secondsToTimeString(bug.timelineSeconds),
            });
          } else {
            console.log("rant2")
            this.form.patchValue({
              title: bug.title,
              description: bug.description,
              status: bug.status,
              type: bug.type,
              deadline: bug.deadline
                ? new Date(bug.deadline).toISOString().split('T')[0]
                : null,
              developerId: bug.developerId,
            });
          }
          this.createdBugId.set(bug.id);
        },
        error: (err) =>
          alert('Failed to load bug: ' + (err.error?.message || err.message)),
      });
    }

    if (changes['projectId'] && this.form && !this.isDeveloper) {
      this.form.patchValue({ projectId: this.projectId() });
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
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
      // Developer: send only status + timelineSeconds
      const payload = {
        status: this.form.value.status,
        timelineSeconds: this.timeStringToSeconds(this.form.value.timeline),
      };
      this.bugService.updateBug(this.bugId()!, payload).subscribe({
        next: () => this.navigateBack(),
        error: (err) => {
          this.isSubmitting.set(false);
          alert('Failed to update bug: ' + (err.error?.message || err.message));
        },
      });
      return;
    }

    // QA: create or update (no timeline — default 0)
    const data = { ...this.form.value, timelineSeconds: 0 };

    if (this.isEditMode() && this.bugId()) {
      this.bugService.updateBug(this.bugId()!, data).subscribe({
        next: (bug) => this.uploadScreenshotIfSelected(bug.id),
        error: (err) => {
          this.isSubmitting.set(false);
          alert('Failed to update bug: ' + (err.error?.message || err.message));
        },
      });
    } else {
      this.bugService.createBug(data).subscribe({
        next: (bug) => {
          this.createdBugId.set(bug.id);
          this.uploadScreenshotIfSelected(bug.id);
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
        next: () => this.navigateBack(),
        error: (err) => {
          this.isSubmitting.set(false);
          alert(
            'Bug saved but screenshot upload failed: ' +
              (err.error?.message || err.message),
          );
          this.navigateBack();
        },
      });
    } else {
      this.navigateBack();
    }
  }

  // ── Time ↔ Seconds helpers ──────────────────────────────────────────────

  /** Converts seconds into "HH:MM" for <input type="time"> */
  private secondsToTimeString(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  /** Converts "HH:MM" from <input type="time"> into total seconds */
  private timeStringToSeconds(time: string): number {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60;
  }

  navigateBack(): void {
    this.isSubmitting.set(false);
    this.router.navigate(['/projects', this.projectId()]);
  }
}

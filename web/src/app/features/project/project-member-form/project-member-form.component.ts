import {
  Component,
  inject,
  input,
  signal,
  computed,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { ProjectService } from '../../../core/services/project.service';
import { User } from '../../../core/models/user.model';
import { UserRoles } from '../../../types/types';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-project-member-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './project-member-form.component.html',
  styleUrl: './project-member-form.component.css',
})
export class ProjectMemberFormComponent implements OnChanges, OnInit {
  userService = inject(UserService);
  projectService = inject(ProjectService);
  router = inject(Router);

  isAddForm = input.required<boolean>();
  projectId = input.required<number>();

  allUsers = signal<User[]>([]);
  projectMembers = signal<User[]>([]);
  searchControl = new FormControl('');
  selectedUsers = signal<User[]>([]);

  isSubmitted = signal<boolean>(false);

  ngOnInit() {
    this.userService.getAllUsers([UserRoles.DEVELOPER, UserRoles.QA]).subscribe({
      next: (users) => this.allUsers.set(users),
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['projectId'] && this.projectId()) {
      this.projectService.getProjectMembers(this.projectId()).subscribe({
        next: (res) => this.projectMembers.set(res || []),
      });
    }
  }

  availableUsers = computed(() => {
    const search = this.searchControl.value?.toLowerCase() || '';
    const members = this.projectMembers();
    const membersIds = new Set(members.map((m) => m.id));
    const all = this.allUsers();

    let baseList = this.isAddForm() ? all.filter((u) => !membersIds.has(u.id)) : members;

    const selectedIds = new Set(this.selectedUsers().map((u) => u.id));
    baseList = baseList.filter((u) => !selectedIds.has(u.id));

    if (search) {
      baseList = baseList.filter(
        (u) => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search),
      );
    }
    return baseList;
  });

  selectUser(user: User) {
    this.selectedUsers.update((users) => [...users, user]);
  }

  deselectUser(user: User) {
    this.selectedUsers.update((users) => users.filter((u) => u.id !== user.id));
  }

  onSubmit() {
    if (this.isSubmitted()) return;
    this.isSubmitted.set(true);
    const selectedIds = this.selectedUsers().map((u) => u.id);
    if (selectedIds.length === 0) return alert('Please select at least one user');

    const action = this.isAddForm()
      ? this.projectService.addMembers(this.projectId(), selectedIds)
      : this.projectService.removeMembers(this.projectId(), selectedIds);

    action.pipe(finalize(() => this.isSubmitted.set(false))).subscribe({
      next: () => {
        alert(this.isAddForm() ? 'Members added Successfully' : 'Members removed Successfully');
        this.router.navigate(['/projects']);
      },
      error: (error: HttpErrorResponse) => {
        alert(
          error.error.message || this.isAddForm()
            ? 'Error adding members'
            : 'Error removing members',
        );
      },
    });
  }
}

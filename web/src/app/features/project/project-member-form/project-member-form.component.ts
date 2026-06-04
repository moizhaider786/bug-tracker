import { Component, effect, inject, input, signal } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { UserRoles } from '../../../types/types';
@Component({
  selector: 'app-project-member-form',
  imports: [],
  templateUrl: './project-member-form.component.html',
  styleUrl: './project-member-form.component.css',
})
export class ProjectMemberFormComponent {
  userService = inject(UserService);
  isAddForm = input<boolean>();
  users = signal<User[]>([]);

  constructor() {
    effect(() => {
      this.userService.getAllUsers([UserRoles.DEVELOPER, UserRoles.QA]).subscribe((users) => {
        this.users.set(users);
        console.log('All users:', users);
      });
    });
  }

  onSubmit() {
    // Handle form submission logic here
  }

}

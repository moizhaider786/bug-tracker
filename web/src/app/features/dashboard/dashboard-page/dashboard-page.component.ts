import { Component, inject, signal, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserRoles } from '../../../types/types';
import { GetUserProjectsAndBugsCountResponseDto } from '../../../core/dtos/user/get-user-projects-and-bugs-count.dto';

@Component({
  selector: 'app-dashboard-page',
  imports: [],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
})
export class DashboardPageComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);

  readonly UserRoles = UserRoles;
  readonly role = this.authService.getUser()?.role || '';

  stats = signal<GetUserProjectsAndBugsCountResponseDto | null>(null);

  ngOnInit(): void {
    this.userService.getProjectsAndBugsCount().subscribe({
      next: (res) => {
        this.stats.set(res);
      },
    });
  }
  getPercent(count: number, total: number): number {
    return total === 0 ? 0 : Math.round((count / total) * 100);
  }
}

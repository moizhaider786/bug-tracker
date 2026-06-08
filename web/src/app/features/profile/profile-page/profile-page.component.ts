import { Component, signal, OnInit, inject } from '@angular/core';
import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile-page',
  imports: [],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.css',
})
export class ProfilePageComponent implements OnInit {
  userData = signal<User | null>(null);
  authService = inject(AuthService);

  ngOnInit(): void {
    this.authService.getProfile().subscribe({
      next: (res) => {
        this.userData.set(res);
      },
      error: (error: any) => {
        alert(error.error.message || error.message || 'Failed to fetch profile details');
      },
    });
  }
  
}

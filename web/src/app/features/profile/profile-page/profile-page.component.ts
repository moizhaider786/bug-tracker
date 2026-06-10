import { Component, signal, OnInit, inject } from '@angular/core';
import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-profile-page',
  imports: [],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.css',
})
export class ProfilePageComponent implements OnInit {
  userData = signal<User | null>(null);
  authService = inject(AuthService);
  modalService = inject(ModalService);

  ngOnInit(): void {
    this.authService.getProfile().subscribe({
      next: (res) => {
        this.userData.set(res);
      },
      error: (error: any) => {
        this.modalService.showError(error.error.message || error.message || 'Failed to fetch profile details');
      },
    });
  }
  
}

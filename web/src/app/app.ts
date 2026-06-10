import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './core/sidebar/sidebar.component';
import { AuthService } from './core/services/auth.service';
import { SidebarService } from './core/services/sidebar.service';
import { NotificationBellComponent } from './core/components/notification-bell/notification-bell.component';
import { ModalComponent } from './core/components/modal/modal.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent, NotificationBellComponent, ModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  authService = inject(AuthService);
  sidebarService = inject(SidebarService);
  protected readonly title = signal('web');
}

import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, AppNotification } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-notification-bell',
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css'],
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  notifications = signal<AppNotification[]>([]);
  isDropdownOpen = false;
  private sseSub?: Subscription;

  unreadCount = computed(() => this.notifications().filter((n) => !n.isRead).length);

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    if (!this.authService.isAuthenticated()) return;

    this.notificationService.getNotifications().subscribe({
      next: (data) => this.notifications.set(data),
      error: (err) => console.error('Failed to load notifications', err),
    });

    this.sseSub = this.notificationService.getServerSentEvent().subscribe({
      next: (notification) => {
        const exists = this.notifications().some((n) => n.id === notification.id);
        if (!exists) {
          this.notifications.update((notifs) => [notification, ...notifs]);
        }
      },
      error: (err) => console.error('SSE connection error', err),
    });
  }

  ngOnDestroy() {
    this.sseSub?.unsubscribe();
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;

    if (!this.isDropdownOpen) {
      const unread = this.notifications().filter((n) => !n.isRead);
      if (!unread.length) return;
      this.notifications.update((notifs) =>
        notifs.map((n) => (n.isRead ? n : { ...n, isRead: true })),
      );

      unread.forEach((notif) => {
        this.notificationService.markAsRead(notif.id).subscribe({
          error: (err) => console.error(`Failed to mark ${notif.id} as read`, err),
        });
      });
    }
  }
}

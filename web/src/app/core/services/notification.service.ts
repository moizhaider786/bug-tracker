import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { NotificationTypes } from '../../types/types';

export interface AppNotification {
  id: number;
  title: string;
  description?: string;
  type: NotificationTypes;
  createdAt: Date;
  isRead: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notification`;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private zone: NgZone,
  ) {}

  getNotifications(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(this.apiUrl);
  }

  markAsRead(notificationId: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${notificationId}/read`, {});
  }

  getServerSentEvent(): Observable<AppNotification> {
    return new Observable<AppNotification>((observer) => {
      let eventSource: EventSource | null = null;

      const connect = () => {
        const token = this.authService.getToken();
        if (!token) {
          observer.error('No token found');
          return;
        }

        eventSource = new EventSource(`${this.apiUrl}/stream?token=${token}`);

        eventSource.onmessage = (event) => {
          this.zone.run(() => {
            try {
              const data: AppNotification = JSON.parse(event.data as string);
              observer.next(data);
            } catch (e) {
              console.error('Error parsing SSE notification', e);
            }
          });
        };

        eventSource.onerror = () => {
          eventSource?.close();
          eventSource = null;
        };
      };

      connect();

      return () => {
        eventSource?.close();
      };
    });
  }
}

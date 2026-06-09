import { Injectable, NgZone } from '@angular/core';
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
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private authService: AuthService, private zone: NgZone) {}

  getServerSentEvent(): Observable<AppNotification> {
    return new Observable((observer) => {
      const token = this.authService.getToken();
      if (!token) {
        observer.error('No token found');
        return;
      }

      const eventSource = new EventSource(`${environment.apiUrl}/notification/stream?token=${token}`);

      eventSource.onmessage = (event) => {
        this.zone.run(() => {
          try {
            const data = JSON.parse(event.data);
            observer.next(data);
          } catch (e) {
            console.error('Error parsing notification data', e);
          }
        });
      };

      eventSource.onerror = (error) => {
        this.zone.run(() => {
          observer.error(error);
          eventSource.close();
        });
      };

      return () => {
        eventSource.close();
      };
    });
  }
}

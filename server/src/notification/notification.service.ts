import { Injectable, MessageEvent } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Notifications } from './notification.entity';
import { Repository } from 'typeorm';
import { NotificationsToUsers } from './notification-to-user.entity';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export type NotificationWithReadStatus = Notifications & { isRead: boolean };

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notifications)
    private notificationsRepo: Repository<Notifications>,
    @InjectRepository(NotificationsToUsers)
    private notificationsToUsersRepo: Repository<NotificationsToUsers>,
  ) {}

  private notificationSubject = new Subject<{
    userId: number;
    notification: Notifications;
  }>();

  async create(data: CreateNotificationDto) {
    const { users, ...notificationsData } = data;
    const notification = this.notificationsRepo.create(notificationsData);
    const newNotification = await this.notificationsRepo.save(notification);

    if (users?.length) {
      await this.notificationsToUsersRepo.insert(
        users.map((userId) => ({
          notificationId: newNotification.id,
          recieverId: userId,
        })),
      );

      users.forEach((userId) => {
        this.notificationSubject.next({ userId, notification: newNotification });
      });
    }
    return newNotification;
  }

  streamNotification(userId: number): Observable<MessageEvent> {
    return this.notificationSubject.asObservable().pipe(
      filter((event) => event.userId === userId),
      map((event) => ({
        data: { ...event.notification, isRead: false },
      })),
    );
  }

  async get(userId: number): Promise<NotificationWithReadStatus[]> {
    const rows = await this.notificationsToUsersRepo.find({
      where: { recieverId: userId },
      relations: { notification: true },
      order: { notification: { createdAt: 'DESC' } },
    });
    return rows.map((row) => ({ ...row.notification, isRead: row.isRead }));
  }

  async markAsRead(notificationId: number, userId: number): Promise<void> {
    await this.notificationsToUsersRepo.update(
      { notificationId, recieverId: userId },
      { isRead: true },
    );
  }
}

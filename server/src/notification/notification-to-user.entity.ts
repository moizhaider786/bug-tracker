import { Users } from 'src/user/user.entity';
import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Notifications } from './notification.entity';

@Entity()
export class NotificationsToUsers {
  @PrimaryColumn()
  recieverId!: number;

  @PrimaryColumn()
  notificationId!: number;

  @ManyToOne(() => Users, (user) => user.userNotifications)
  @JoinColumn({ name: 'recieverId' })
  user!: Users;

  @ManyToOne(() => Notifications, (notification) => notification.notificationUsers)
  @JoinColumn({ name: 'notificationId' })
  notification!: Notifications;

  @Column({ default: false })
  isRead!: boolean;
}
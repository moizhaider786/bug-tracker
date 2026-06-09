import { NotificationTypes } from 'src/types';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { NotificationsToUsers } from './notification-to-user..entity';

@Entity()
export class Notifications {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 280 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: NotificationTypes })
  type!: NotificationTypes;

  @OneToMany(() => NotificationsToUsers, (ntou) => ntou.notification)
  notificationUsers!: NotificationsToUsers[];

  @CreateDateColumn()
  createdAt!: Date;
}

import { Global, Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notifications } from './notification.entity';
import { NotificationsToUsers } from './notification-to-user.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Notifications, NotificationsToUsers])],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}

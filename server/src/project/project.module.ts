import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Projects } from './project.entity';
import { ProjectsToUsers } from './project-to-user.entity';
import { NotificationService } from 'src/notification/notification.service';
import { Notifications } from 'src/notification/notification.entity';
import { NotificationsToUsers } from 'src/notification/notification-to-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Projects,
      ProjectsToUsers,
      Notifications,
      NotificationsToUsers,
    ]),
  ],
  controllers: [ProjectController],
  providers: [ProjectService, NotificationService],
})
export class ProjectModule {}

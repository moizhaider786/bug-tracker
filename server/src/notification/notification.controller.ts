import { Controller, Sse, UseGuards, Req } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(AuthGuard)
  @Sse('stream')
  stream(@Req() req: any) {
    return this.notificationService.streamNotification(req.user.id);
  }
}

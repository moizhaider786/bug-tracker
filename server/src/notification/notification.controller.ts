import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Req,
  Sse,
} from '@nestjs/common';
import type { Request } from 'express';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Sse('stream')
  stream(@Req() req: Request) {
    return this.notificationService.streamNotification(req.user!.id);
  }

  @Get()
  getAll(@Req() req: Request) {
    return this.notificationService.get(req.user!.id);
  }

  @Patch(':id/read')
  markRead(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationService.markAsRead(id, req.user!.id);
  }
}

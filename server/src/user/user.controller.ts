import { Controller } from '@nestjs/common';
import { Get, Req} from '@nestjs/common';
import type { Request } from 'express';

@Controller('user')
export class UserController {
  @Get('profile')
  profile(@Req() request: Request) {
    console.log(request.user);
  }
}

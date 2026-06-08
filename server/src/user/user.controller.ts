import {
  Controller,
  ParseArrayPipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { UserRoles } from 'src/types';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get('profile')
  profile(@Req() request: Request) {
    // console.log(request.user);
  }

  @Get('all')
  async getAllUsers(
    @Query('roles', new ParseArrayPipe({ items: String, separator: ',' }))
    roles: UserRoles[],
  ) {
    return await this.userService.findAll(roles);
  }
}

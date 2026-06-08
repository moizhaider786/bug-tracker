import {
  Controller,
  ParseArrayPipe,
  Query,
} from '@nestjs/common';
import { Get } from '@nestjs/common';
import type { Request } from 'express';
import { UserRoles } from 'src/types';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get('all')
  async getAllUsers(
    @Query('roles', new ParseArrayPipe({ items: String, separator: ',' }))
    roles: UserRoles[],
  ) {
    return await this.userService.findAll(roles);
  }
}
